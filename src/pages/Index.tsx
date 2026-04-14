import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, Heart, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/CartContext";
import type { FarmerProduct } from "@/types/farmerProduct";
import heroProduce from "@/assets/hero-produce.jpg";

export default function Index() {
  const [recentProducts, setRecentProducts] = useState<FarmerProduct[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    const stored: FarmerProduct[] = JSON.parse(localStorage.getItem("recentlyViewedProducts") || "[]");
    setRecentProducts(stored);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">
                  <Heart className="w-3.5 h-3.5" /> Farm-to-table freshness
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                  Fresh food from{" "}
                  <span className="text-primary">local farms</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Discover and buy directly from farmers in your community.
                  Fresher produce, fair prices, and a stronger local food system.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/marketplace">
                    <Button size="lg" className="rounded-full px-8 gap-2">
                      Shop Now <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/account">
                    <Button size="lg" variant="outline" className="rounded-full px-8">
                      Start Selling
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="rounded-3xl overflow-hidden card-shadow-hover">
                  <img
                    src={heroProduce}
                    alt="Fresh local produce"
                    width={1920}
                    height={1080}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: "Farm Fresh Delivery", desc: "Products go from farm to your door, never sitting in warehouses." },
              { icon: Shield, title: "Trusted Farmers", desc: "Every farmer is verified. Know exactly where your food comes from." },
              { icon: Heart, title: "Support Local", desc: "Your purchase directly supports small farms in your community." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently viewed products */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Recently Viewed</h2>
              <p className="text-muted-foreground mt-1">Pick up where you left off</p>
            </div>
            {recentProducts.length > 0 && (
              <Link to="/marketplace" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Browse all <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          {recentProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {recentProducts.map((p) => (
                <div key={p.id} className="group bg-card rounded-2xl overflow-hidden border border-border card-shadow-hover">
                  <Link to={`/product/${p.id}`}>
                    <div className="aspect-square overflow-hidden bg-muted flex items-center justify-center">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="p-4 pb-2">
                      <p className="text-xs text-muted-foreground mb-1">{p.farmName}</p>
                      <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">{p.name}</h3>
                      <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                    </div>
                  </Link>
                  <div className="px-4 pb-4 pt-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground">${p.price.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-1">/ {p.unit}</span>
                    </div>
                    <button
                      onClick={() => addItem(p)}
                      className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-lg">No recently viewed products yet.</p>
              <p className="text-muted-foreground text-sm mt-1">Browse the marketplace and products you view will appear here.</p>
              <Link to="/marketplace" className="mt-6">
                <Button variant="outline" className="rounded-full px-8">Browse Marketplace</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
