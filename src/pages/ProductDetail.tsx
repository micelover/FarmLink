import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { FarmerProduct } from "@/types/farmerProduct";
import { ArrowLeft, Package, MapPin, ShoppingCart, Plus, Minus, Leaf } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items, updateQuantity } = useCart();

  const [product, setProduct] = useState<FarmerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const cartItem = items.find((i) => i.product.id === id);
  const quantity = cartItem?.quantity ?? 0;

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "products", id)).then((snap) => {
      if (snap.exists()) {
        setProduct({ id: snap.id, ...(snap.data() as Omit<FarmerProduct, "id">) });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !product) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Product not found</h2>
        <p className="text-muted-foreground mb-6">This product may have been removed by the farmer.</p>
        <Button className="rounded-full" onClick={() => navigate("/marketplace")}>
          Back to Marketplace
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="rounded-3xl overflow-hidden bg-muted aspect-square flex items-center justify-center">
            {product.imageUrl && !imgError ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Package className="w-20 h-20 text-muted-foreground/20" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Category + farm */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>

            {/* Farm */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
              <Leaf className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium text-foreground">{product.farmName}</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-4xl font-extrabold text-foreground">${product.price.toFixed(2)}</span>
              <span className="text-muted-foreground text-lg">/ {product.unit}</span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-2">
                <button
                  onClick={() => quantity > 0 && updateQuantity(product.id, quantity - 1)}
                  className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                  disabled={quantity === 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-base font-semibold w-6 text-center">{quantity}</span>
                <button
                  onClick={() => quantity > 0 ? updateQuantity(product.id, quantity + 1) : null}
                  className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to cart button */}
              <Button
                size="lg"
                className="rounded-full gap-2 flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4" />
                {added ? "Added!" : "Add to Cart"}
              </Button>
            </div>

            {quantity > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {quantity} in cart — ${(product.price * quantity).toFixed(2)} total
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-border mt-8 pt-6 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <Leaf className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Sold by </span>
                  <Link
                    to={`/farm/${product.farmerId}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {product.farmName}
                  </Link>
                </div>
              </div>
              {product.farmName && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Local farm — freshly harvested</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
