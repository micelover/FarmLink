import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import FarmerCard from "@/components/FarmerCard";
import { products, farmers } from "@/data/mockData";
import heroProduce from "@/assets/hero-produce.jpg";

export default function Index() {
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
                  <Link to="/auth">
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

      {/* Featured products */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Fresh Picks</h2>
              <p className="text-muted-foreground mt-1">Popular products from nearby farms</p>
            </div>
            <Link to="/marketplace" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured farmers */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Meet the Farmers</h2>
              <p className="text-muted-foreground mt-1">The people behind your food</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {farmers.map((f) => (
              <FarmerCard key={f.id} farmer={f} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to eat fresher?
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Join thousands of customers supporting local farms and eating better.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/marketplace">
              <Button size="lg" className="rounded-full px-8">Browse Marketplace</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
