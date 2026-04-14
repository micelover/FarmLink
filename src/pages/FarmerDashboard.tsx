import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  Leaf, Package, DollarSign, ShoppingBag, TrendingUp,
  Plus, MapPin, FileText, Loader2, ArrowRight, LayoutDashboard,
} from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useFarmerProducts } from "@/hooks/useFarmerProducts";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FarmerProductCard from "@/components/FarmerProductCard";
import AddProductForm from "@/components/AddProductForm";

interface OrderItem {
  productId: string;
  farmerId: string;
  farmName: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface Order {
  id: string;
  buyerId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}

export default function FarmerDashboard() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const isFarmer = profile?.role === "farmer";

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } =
    useFarmerProducts(
      isFarmer ? (user?.uid ?? "") : "",
      isFarmer ? (profile?.farmName ?? "") : ""
    );

  // Fetch recent orders and filter for this farmer
  useEffect(() => {
    if (!user || !isFarmer) return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(200));
    getDocs(q).then((snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }));
      const mine = all.filter((o) => o.items.some((i) => i.farmerId === user.uid));
      setOrders(mine);
    }).finally(() => setOrdersLoading(false));
  }, [user, isFarmer]);

  const handlePayout = async () => {
    setPayoutLoading(true);
    setPayoutMsg(null);
    try {
      const requestPayout = httpsCallable(getFunctions(app), "requestPayout");
      const result = await requestPayout({});
      const { amount } = result.data as { amount: number };
      setPayoutMsg({ type: "success", text: `Payout of $${amount.toFixed(2)} requested — arrives in 3–5 business days.` });
      await refreshProfile();
    } catch (err: unknown) {
      setPayoutMsg({ type: "error", text: (err as { message?: string }).message ?? "Payout failed." });
    } finally {
      setPayoutLoading(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!isFarmer) return <Navigate to="/account" replace />;

  // Compute stats from orders
  const myItems = orders.flatMap((o) => o.items.filter((i) => i.farmerId === user.uid));
  const totalRevenue = myItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalUnitsSold = myItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{profile?.farmName ?? "Your Farm"}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                {profile?.farmStreet
                  ? <><MapPin className="w-3 h-3" />{[profile.farmStreet, profile.farmCity, profile.farmState].filter(Boolean).join(", ")}</>
                  : profile?.farmLocation
                  ? <><MapPin className="w-3 h-3" />{profile.farmLocation}</>
                  : "No address set"}
              </p>
            </div>
          </div>
          <Link to="/account">
            <Button variant="outline" size="sm" className="rounded-full gap-2">
              <FileText className="w-3.5 h-3.5" /> Edit Farm Profile
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Package,
              label: "Products Listed",
              value: productsLoading ? "—" : products.length.toString(),
            },
            {
              icon: DollarSign,
              label: "Earnings Balance",
              value: `$${(profile?.balance ?? 0).toFixed(2)}`,
            },
            {
              icon: ShoppingBag,
              label: "Total Orders",
              value: ordersLoading ? "—" : orders.length.toString(),
            },
            {
              icon: TrendingUp,
              label: "Total Revenue",
              value: ordersLoading ? "—" : `$${totalRevenue.toFixed(2)}`,
            },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left col: recent sales + payout */}
          <div className="md:col-span-2 space-y-6">

            {/* Earnings & Payout */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Earnings Balance
                </h2>
                <Button
                  className="rounded-full gap-2"
                  size="sm"
                  disabled={payoutLoading || (profile?.balance ?? 0) <= 0}
                  onClick={handlePayout}
                >
                  {payoutLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Requesting…</> : "Request Payout"}
                </Button>
              </div>
              <p className="text-4xl font-extrabold text-foreground">${(profile?.balance ?? 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">After 5% platform fee · {totalUnitsSold} units sold all time</p>
              {payoutMsg && (
                <p className={`mt-3 text-sm font-medium ${payoutMsg.type === "success" ? "text-primary" : "text-destructive"}`}>
                  {payoutMsg.text}
                </p>
              )}
            </div>

            {/* Recent Sales */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                <ShoppingBag className="w-4 h-4 text-primary" /> Recent Sales
              </h2>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No sales yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Orders will appear here once customers start buying.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {orders.slice(0, 10).map((order) => {
                    const myOrderItems = order.items.filter((i) => i.farmerId === user.uid);
                    const orderTotal = myOrderItems.reduce((s, i) => s + i.price * i.quantity, 0);
                    return (
                      <div key={order.id} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {myOrderItems.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0 ml-4">
                          ${orderTotal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  {orders.length > 10 && (
                    <p className="text-xs text-muted-foreground pt-3 text-center">{orders.length - 10} more orders not shown</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right col: farm profile + quick links */}
          <div className="space-y-6">

            {/* Farm profile card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                <Leaf className="w-4 h-4 text-primary" /> Farm Profile
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Farm name</p>
                  <p className="font-medium text-foreground">{profile?.farmName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  {profile?.farmStreet ? (
                    <>
                      <p className="font-medium text-foreground">{profile.farmStreet}</p>
                      <p className="text-muted-foreground text-xs">{[profile.farmCity, profile.farmState].filter(Boolean).join(", ")}</p>
                    </>
                  ) : (
                    <p className="font-medium text-foreground">{profile?.farmLocation || "—"}</p>
                  )}
                </div>
                {profile?.farmBio && (
                  <div>
                    <p className="text-xs text-muted-foreground">About</p>
                    <p className="text-foreground line-clamp-3">{profile.farmBio}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <Link to="/account" className="block">
                  <Button variant="outline" size="sm" className="w-full rounded-full gap-2">
                    Edit Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link to={`/farm/${user.uid}`} className="block">
                  <Button variant="ghost" size="sm" className="w-full rounded-full gap-2 text-primary">
                    View Public Page <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-3">Quick Links</h2>
              <div className="space-y-2">
                {[
                  { to: "/marketplace", label: "Browse Marketplace" },
                  { to: "/farms", label: "Farm Map" },
                ].map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* My Products */}
        <div className="mt-6 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> My Products
            </h2>
            {!showAddProduct && (
              <Button size="sm" className="rounded-full gap-2" onClick={() => setShowAddProduct(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
            )}
          </div>
          {showAddProduct && (
            <div className="mb-6">
              <AddProductForm
                onAdd={async (draft) => { await addProduct(draft); setShowAddProduct(false); }}
                onCancel={() => setShowAddProduct(false)}
              />
            </div>
          )}
          {productsLoading && <p className="text-sm text-muted-foreground text-center py-6">Loading products…</p>}
          {!productsLoading && products.length === 0 && !showAddProduct && (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No products yet. Add your first listing above.</p>
            </div>
          )}
          {!productsLoading && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <FarmerProductCard key={p.id} product={p} onUpdate={updateProduct} onDelete={deleteProduct} />
              ))}
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}
