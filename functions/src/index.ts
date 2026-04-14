import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "us-central1" });

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new HttpsError("internal", "Stripe secret key not configured.");
  return new Stripe(secret);
}

const PLATFORM_FEE = 0.05; // 5%

interface CartItemData {
  productId: string;
  farmerId: string;
  farmName: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

/**
 * Creates a Stripe PaymentIntent and returns the clientSecret to the frontend.
 */
export const createPaymentIntent = onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request: CallableRequest<{ items: CartItemData[] }>) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to checkout.");
    }

    const { items } = request.data;
    if (!items || items.length === 0) {
      throw new HttpsError("invalid-argument", "Cart is empty.");
    }

    const totalCents = Math.round(
      items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
    );

    if (totalCents < 50) {
      throw new HttpsError("invalid-argument", "Order total too small.");
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      metadata: { buyerId: request.auth.uid },
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }
);

/**
 * Verifies Stripe payment server-side, writes the order, and increments
 * each farmer's balance in a Firestore transaction.
 */
export const recordOrder = onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (
    request: CallableRequest<{ paymentIntentId: string; items: CartItemData[] }>
  ) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const { paymentIntentId, items } = request.data;
    if (!paymentIntentId || !items?.length) {
      throw new HttpsError("invalid-argument", "Missing required fields.");
    }

    const stripe = getStripe();

    // Verify with Stripe — never trust the frontend alone
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") {
      throw new HttpsError(
        "failed-precondition",
        `Payment not completed (status: ${pi.status}).`
      );
    }

    // Idempotency — check if already recorded
    const existing = await db
      .collection("orders")
      .where("paymentIntentId", "==", paymentIntentId)
      .limit(1)
      .get();
    if (!existing.empty) {
      return { orderId: existing.docs[0].id };
    }

    // Per-farmer earnings after platform fee
    const farmerEarnings: Record<string, number> = {};
    for (const item of items) {
      const net = Math.round(item.price * item.quantity * (1 - PLATFORM_FEE) * 100) / 100;
      farmerEarnings[item.farmerId] = (farmerEarnings[item.farmerId] ?? 0) + net;
    }

    const total = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
    const orderRef = db.collection("orders").doc();

    await db.runTransaction(async (tx) => {
      tx.set(orderRef, {
        id: orderRef.id,
        buyerId: request.auth!.uid,
        paymentIntentId,
        items,
        farmerIds: Object.keys(farmerEarnings),
        total,
        status: "paid",
        createdAt: new Date().toISOString(),
      });

      for (const [farmerId, earnings] of Object.entries(farmerEarnings)) {
        tx.update(db.collection("users").doc(farmerId), {
          balance: admin.firestore.FieldValue.increment(earnings),
        });
      }
    });

    return { orderId: orderRef.id };
  }
);

/**
 * Zeroes the farmer's balance and records a payout request.
 * In production, wire this to stripe.transfers or stripe.payouts.
 */
export const requestPayout = onCall(
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const farmerRef = db.collection("users").doc(request.auth.uid);
    const snap = await farmerRef.get();
    if (!snap.exists) throw new HttpsError("not-found", "User not found.");

    const { balance = 0, role } = snap.data() as { balance?: number; role?: string };
    if (role !== "farmer") {
      throw new HttpsError("permission-denied", "Only farmers can request payouts.");
    }
    if (balance <= 0) {
      throw new HttpsError("failed-precondition", "No balance to withdraw.");
    }

    const payoutRef = db.collection("payouts").doc();
    await db.runTransaction(async (tx) => {
      tx.set(payoutRef, {
        farmerId: request.auth!.uid,
        amount: balance,
        status: "pending",
        requestedAt: new Date().toISOString(),
      });
      tx.update(farmerRef, { balance: 0 });
    });

    return { payoutId: payoutRef.id, amount: balance };
  }
);
