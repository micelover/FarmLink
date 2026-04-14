import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { UserProfile } from "@/lib/AuthContext";
import type { FarmerProduct } from "@/types/farmerProduct";
import { ArrowLeft, Leaf, MapPin, Package, ShoppingCart, Calendar } from "lucide-react";

function ProductCard({ product }: { product: FarmerProduct }) {
  const [imgError, setImgError] = useState(false);
  const { addItem } = useCart();

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border card-shadow-hover">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-muted flex items-center justify-center">
          {product.imageUrl && !imgError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <Package className="w-10 h-10 text-muted-foreground/30" />
          )}
        </div>
        <div className="p-4 pb-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
          )}
          <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {product.category}
          </span>
        </div>
      </Link>
      <div className="px-4 pb-4 pt-2 flex items-center justify-between">
        <div>
          <span className="font-bold text-foreground">${product.price.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground ml-1">/ {product.unit}</span>
        </div>
        <button
          onClick={() => addItem(product)}
          className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function FarmProfile() {
  const { farmerId } = useParams<{ farmerId: string }>();
  const navigate = useNavigate();

  const [farm, setFarm] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<FarmerProduct[]>([]);
  const [loadingFarm, setLoadingFarm] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Fetch farm profile
  useEffect(() => {
    if (!farmerId) return;
    getDoc(doc(db, "users", farmerId)).then((snap) => {
      if (snap.exists() && snap.data().role === "farmer") {
        setFarm(snap.data() as UserProfile);
        const stored: string[] = JSON.parse(localStorage.getItem("recentlyViewedFarms") || "[]");
        const updated = [farmerId, ...stored.filter((id) => id !== farmerId)].slice(0, 6);
        localStorage.setItem("recentlyViewedFarms", JSON.stringify(updated));
      } else {
        setNotFound(true);
      }
      setLoadingFarm(false);
    });
  }, [farmerId]);

  // Fetch this farm's products (real-time)
  useEffect(() => {
    if (!farmerId) return;
    const q = query(collection(db, "products"), where("farmerId", "==", farmerId));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<FarmerProduct, "id">) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setProducts(docs);
    });
    return unsub;
  }, [farmerId]);

  if (loadingFarm) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !farm) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Farm not found</h2>
        <p className="text-muted-foreground mb-6">This farm may no longer be active.</p>
        <Button className="rounded-full" onClick={() => navigate("/farms")}>Back to Farm Map</Button>
      </div>
    </div>
  );

  const joinedYear = farm.createdAt ? new Date(farm.createdAt).getFullYear() : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="hero-gradient border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-start gap-6">
            {/* Farm avatar */}
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Leaf className="w-9 h-9 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-foreground mb-1">{farm.farmName}</h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {farm.farmLocation && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {farm.farmLocation}
                  </span>
                )}
                {joinedYear && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Farming since {joinedYear}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              </div>

              {farm.farmBio && (
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">{farm.farmBio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="font-bold text-foreground text-lg mb-6 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-primary" /> Available Products
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">This farm hasn't listed any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
