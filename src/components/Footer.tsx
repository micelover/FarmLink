import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg text-foreground">FarmLink</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Connecting local farmers with their communities. Fresh food, fair
              prices, and a stronger local food system.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">Shop</h4>
            <ul className="space-y-2">
              {["Vegetables", "Fruits", "Dairy & Eggs", "Pantry"].map((c) => (
                <li key={c}>
                  <Link
                    to="/marketplace"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">Company</h4>
            <ul className="space-y-2">
              {["About Us", "For Farmers", "Blog", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FarmLink. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
