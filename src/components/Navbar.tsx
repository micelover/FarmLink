import { Link } from "react-router-dom";
import { Leaf, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl text-foreground">FarmLink</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/marketplace"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Marketplace
            </Link>
            <Link
              to="/auth"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Farmers
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="w-5 h-5" />
            </Button>
            <Link to="/auth">
              <Button size="sm" className="rounded-full px-5">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
