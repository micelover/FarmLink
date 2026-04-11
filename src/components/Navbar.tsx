import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Leaf, ShoppingBag, LogOut, UserCircle, MapPin } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import CartDrawer from "@/components/CartDrawer";
import AddressModal from "@/components/AddressModal";

export default function Navbar() {
  const { user, profile } = useAuth();
  const { totalItems, setIsOpen } = useCart();
  const { pathname } = useLocation();
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        pathname === to
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <CartDrawer />
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSave={() => setAddressModalOpen(false)}
      />
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo + delivery pill */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/" className="flex items-center gap-2">
                <Leaf className="w-6 h-6 text-primary" />
                <span className="font-bold text-xl text-foreground">FarmLink</span>
              </Link>
              {user && profile?.address && (
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full px-3 py-1.5 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-primary" />
                  Delivering to {profile.city ? `${profile.city}${profile.state ? `, ${profile.state}` : ""}` : profile.address}
                </button>
              )}
              {user && !profile?.address && (
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full px-3 py-1.5 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  Add delivery address
                </button>
              )}
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-7">
              {navLink("/marketplace", "Marketplace")}
              {navLink("/farms", "Farm Map")}
              {navLink("/account", "My Farm")}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-foreground" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>

              {user ? (
                <>
                  <Link to="/account">
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 px-3">
                      <UserCircle className="w-4 h-4" />
                      <span className="hidden md:block max-w-[120px] truncate text-sm">
                        {profile?.name || user.displayName || user.email}
                      </span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 gap-2"
                    onClick={() => signOut(auth)}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:block">Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="rounded-full px-5">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="rounded-full px-5">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
