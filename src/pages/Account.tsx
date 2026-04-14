import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Leaf, User, MapPin, FileText, Package, Plus, Home, DollarSign, Loader2, Building2, ChevronDown, ShoppingBag } from "lucide-react";

interface NominatimResult {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

import { doc, setDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useFarmerProducts } from "@/hooks/useFarmerProducts";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FarmerProductCard from "@/components/FarmerProductCard";
import AddProductForm from "@/components/AddProductForm";
import AddressModal from "@/components/AddressModal";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const inputClass = "w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors";

export default function Account() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [showFarmerForm, setShowFarmerForm] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [farmStreet, setFarmStreet] = useState("");
  const [farmCity, setFarmCity] = useState("");
  const [farmState, setFarmState] = useState("");
  const [farmBio, setFarmBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showEditFarm, setShowEditFarm] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Order history
  interface OrderItem { productId: string; farmerId: string; farmName: string; name: string; price: number; quantity: number; unit: string; }
  interface Order { id: string; buyerId: string; items: OrderItem[]; total: number; status: string; createdAt: string; }
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Street autocomplete
  const [streetConfirmed, setStreetConfirmed] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const sugRef = useRef<HTMLDivElement>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userTyping || farmStreet.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(farmStreet)}&format=json&addressdetails=1&countrycodes=us&limit=6`,
          { headers: { "Accept-Language": "en", "User-Agent": "FarmLink/1.0" } }
        );
        const data: NominatimResult[] = await res.json();
        const filtered = data.filter((d) => d.address.road && d.address.house_number);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [farmStreet, userTyping]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sugRef.current && !sugRef.current.contains(e.target as Node) &&
        streetInputRef.current && !streetInputRef.current.contains(e.target as Node)
      ) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSuggestion = (s: NominatimResult) => {
    const a = s.address;
    setFarmStreet([a.house_number, a.road].filter(Boolean).join(" "));
    setFarmCity(a.city || a.town || a.village || a.county || "");
    setFarmState(a.state || "");
    setStreetConfirmed(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setUserTyping(false);
  };

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isFarmer = profile?.role === "farmer";

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("buyerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    getDocs(q)
      .then((snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }))))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user]);

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

  const { products, loading: productsLoading, error: productsError, addProduct, updateProduct, deleteProduct } =
    useFarmerProducts(
      isFarmer ? (user?.uid ?? "") : "",
      isFarmer ? (profile?.farmName ?? "") : ""
    );

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) { setError("Farm name is required."); return; }
    if (!farmStreet.trim()) { setError("Street address is required."); return; }
    if (!streetConfirmed) { setError("Please select a real address from the suggestions."); return; }
    if (!farmCity.trim()) { setError("City is required."); return; }
    if (!farmState.trim()) { setError("State is required."); return; }
    setSaving(true);
    setError("");
    const farmLocation = [farmStreet, farmCity, farmState].filter(Boolean).join(", ");
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: profile?.name || user.displayName || "",
        email: user.email || "",
        role: "farmer",
        farmName: farmName.trim(),
        farmStreet: farmStreet.trim(),
        farmCity: farmCity.trim(),
        farmState: farmState.trim(),
        farmLocation,
        farmBio: farmBio.trim(),
        createdAt: profile?.createdAt || new Date().toISOString(),
      }, { merge: true });
      await refreshProfile();
      setSaved(true);
      setShowFarmerForm(false);
      setShowEditFarm(false);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const farmAddressForm = (
    <form onSubmit={handleSaveFarm} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Farm Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Farm Name <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Green Valley Farm"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Street Address with autocomplete */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Street Address <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <input
            ref={streetInputRef}
            type="text"
            placeholder="2145 Mornington Lane"
            value={farmStreet}
            onChange={(e) => { setFarmStreet(e.target.value); setUserTyping(true); setStreetConfirmed(false); setFarmCity(""); setFarmState(""); }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            autoComplete="off"
            className={inputClass}
          />
          {loadingSuggestions && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={sugRef} className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => {
                const a = s.address;
                const street = [a.house_number, a.road].filter(Boolean).join(" ");
                const locality = [a.city || a.town || a.village, a.state].filter(Boolean).join(", ");
                return (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-start gap-2.5 border-b border-border last:border-0"
                    onMouseDown={() => selectSuggestion(s)}
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{street}</p>
                      {locality && <p className="text-xs text-muted-foreground">{locality}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* City + State row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            City <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Auto-filled"
              value={farmCity}
              onChange={(e) => setFarmCity(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            State <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={farmState}
              onChange={(e) => setFarmState(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors appearance-none"
            >
              <option value="">Select…</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* About */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">About your farm</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <textarea
            rows={3}
            placeholder="Tell customers about your farm and what you grow..."
            value={farmBio}
            onChange={(e) => setFarmBio(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="rounded-full px-6">
          {saving ? "Saving…" : showEditFarm ? "Save Changes" : "Confirm"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full"
          onClick={() => { setShowFarmerForm(false); setShowEditFarm(false); setError(""); }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-2xl font-bold text-foreground mb-8">My Account</h1>

        {/* Profile card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile?.name || user.displayName || "—"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
            {isFarmer ? <><Leaf className="w-3 h-3" /> Farmer</> : <><User className="w-3 h-3" /> Customer</>}
          </div>
        </div>

        {/* Delivery Address card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" /> Delivery Address
            </h2>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAddressModalOpen(true)}>
              {profile?.address ? "Edit" : "Add Address"}
            </Button>
          </div>
          {profile?.address ? (
            <div className="text-sm text-foreground space-y-0.5">
              <p>{profile.address}</p>
              {(profile.city || profile.state || profile.zipCode) && (
                <p className="text-muted-foreground">
                  {[profile.city, profile.state, profile.zipCode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No address saved. Add one so we know where to deliver.</p>
          )}
        </div>
        <AddressModal
          isOpen={addressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          onSave={() => setAddressModalOpen(false)}
        />

        {/* Farmer info */}
        {isFarmer && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Leaf className="w-4 h-4 text-primary" /> Your Farm
              </h2>
              {!showEditFarm && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setFarmName(profile?.farmName || "");
                    setFarmStreet("");
                    setFarmCity("");
                    setFarmState("");
                    setStreetConfirmed(false);
                    setFarmBio(profile?.farmBio || "");
                    setError("");
                    setSaved(false);
                    setShowEditFarm(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>

            {!showEditFarm ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="font-medium w-24 text-muted-foreground">Farm name</span>
                  {profile?.farmName || "—"}
                </div>
                <div className="flex items-start gap-2 text-foreground">
                  <span className="font-medium w-24 text-muted-foreground shrink-0">Address</span>
                  <div>
                    {profile?.farmStreet && <p>{profile.farmStreet}</p>}
                    {(profile?.farmCity || profile?.farmState) && (
                      <p className="text-muted-foreground">{[profile.farmCity, profile.farmState].filter(Boolean).join(", ")}</p>
                    )}
                    {!profile?.farmStreet && !profile?.farmCity && (profile?.farmLocation || "—")}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-foreground">
                  <span className="font-medium w-24 text-muted-foreground shrink-0">About</span>
                  {profile?.farmBio || "—"}
                </div>
                {saved && <p className="mt-2 text-sm text-primary font-medium">Farm profile saved!</p>}
              </div>
            ) : farmAddressForm}
          </div>
        )}

        {/* Earnings Balance — farmers only */}
        {isFarmer && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Earnings Balance
            </h2>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-foreground">
                  ${(profile?.balance ?? 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">After 5% platform fee</p>
              </div>
              <Button
                className="rounded-full gap-2"
                disabled={payoutLoading || (profile?.balance ?? 0) <= 0}
                onClick={handlePayout}
              >
                {payoutLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Requesting…</> : "Request Payout"}
              </Button>
            </div>
            {payoutMsg && (
              <p className={`mt-3 text-sm font-medium ${payoutMsg.type === "success" ? "text-primary" : "text-destructive"}`}>
                {payoutMsg.text}
              </p>
            )}
          </div>
        )}

        {/* My Products — farmers only */}
        {isFarmer && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
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
            {!productsLoading && productsError && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">{productsError}</div>
            )}
            {!productsLoading && products.length === 0 && !showAddProduct && (
              <div className="text-center py-10">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No products yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add Product" to list your first item.</p>
              </div>
            )}
            {!productsLoading && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((p) => (
                  <FarmerProductCard key={p.id} product={p} onUpdate={updateProduct} onDelete={deleteProduct} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order History */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-primary" /> Order History
          </h2>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {orders.map((order) => (
                <div key={order.id} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{order.items.map((i) => i.farmName).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0 ml-4">${order.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Become a farmer section */}
        {!isFarmer && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Become a Farmer</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Start listing your products and sell directly to local customers.</p>
              </div>
            </div>
            {!showFarmerForm ? (
              <Button className="rounded-full px-6" onClick={() => { setShowFarmerForm(true); setFarmName(""); setFarmStreet(""); setFarmCity(""); setFarmState(""); setFarmBio(""); setStreetConfirmed(false); setError(""); }}>
                Start Selling
              </Button>
            ) : farmAddressForm}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
