import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { X, ShoppingBag, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import type { CartItem } from "@/lib/CartContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");
const functions = getFunctions(app);

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Inner form — lives inside <Elements> so it can use useStripe/useElements
function PaymentForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalPrice } = useCart();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    // Submit the Elements form (validates fields)
    const submitResult = await elements.submit();
    if (submitResult.error) {
      setError(submitResult.error.message ?? "Payment form error.");
      setPaying(false);
      return;
    }

    // Confirm payment with Stripe
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed.");
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // Record order server-side (verifies payment + updates farmer balances)
      try {
        const recordOrder = httpsCallable(functions, "recordOrder");
        await recordOrder({
          paymentIntentId: paymentIntent.id,
          items: items.map((i: CartItem) => ({
            productId: i.product.id,
            farmerId: i.product.farmerId,
            farmName: i.product.farmName,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            unit: i.product.unit,
          })),
        });
        onSuccess();
      } catch (err: unknown) {
        setError((err as { message?: string }).message ?? "Order recording failed. Contact support.");
        setPaying(false);
      }
    } else {
      setError("Payment did not complete. Please try again.");
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Order summary */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-2">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex justify-between text-sm">
            <span className="text-foreground">
              {product.name}
              <span className="text-muted-foreground ml-1">× {quantity}</span>
            </span>
            <span className="font-medium">${(product.price * quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
          <span>Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Payment details</p>
        <PaymentElement />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <Button type="submit" disabled={paying || !stripe} className="w-full rounded-full h-11 font-semibold gap-2">
        {paying ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        ) : (
          `Pay $${totalPrice.toFixed(2)}`
        )}
      </Button>

      <button
        type="button"
        onClick={onClose}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
      >
        Cancel
      </button>
    </form>
  );
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, totalPrice, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch PaymentIntent client secret when modal opens
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    setClientSecret(null);
    setInitError(null);
    setSuccess(false);
    setLoading(true);

    const createPI = httpsCallable(getFunctions(app), "createPaymentIntent");
    createPI({
      items: items.map((i: CartItem) => ({
        productId: i.product.id,
        farmerId: i.product.farmerId,
        farmName: i.product.farmName,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        unit: i.product.unit,
      })),
    })
      .then((result) => {
        const data = result.data as { clientSecret: string };
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        setInitError(err?.message ?? "Could not start checkout. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, items]);

  const handleSuccess = () => {
    setSuccess(true);
    clearCart();
    setTimeout(onClose, 3500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-background rounded-2xl w-full max-w-md shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Checkout</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-6 py-5">
            {/* Success state */}
            {success && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
                <h3 className="font-bold text-foreground text-lg">Order placed!</h3>
                <p className="text-muted-foreground text-sm">
                  Your order of ${totalPrice.toFixed(2)} was successful. The farmer will be notified.
                </p>
              </div>
            )}

            {/* Loading PaymentIntent */}
            {!success && loading && (
              <div className="flex items-center justify-center py-12 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Preparing checkout…</span>
              </div>
            )}

            {/* Init error */}
            {!success && !loading && initError && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {initError}
              </div>
            )}

            {/* Payment form */}
            {!success && !loading && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: { colorPrimary: "#16a34a", borderRadius: "8px" },
                  },
                }}
              >
                <PaymentForm onSuccess={handleSuccess} onClose={onClose} />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
