import { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, Package } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AddressModal from "@/components/AddressModal";
import CheckoutModal from "@/components/CheckoutModal";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const { user, profile } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <>
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={() => { setShowAddressModal(false); setShowCheckout(true); }}
      />
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-background border-l border-border z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Your Cart</h2>
            {totalItems > 0 && (
              <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30" />
              <p className="font-medium text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Browse the marketplace and add some fresh produce!</p>
              <Button
                className="rounded-full mt-2"
                onClick={() => setIsOpen(false)}
              >
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 bg-muted/30 rounded-2xl p-3">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{product.farmName}</p>
                    <p className="text-sm font-medium text-foreground leading-tight truncate">{product.name}</p>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      ${(product.price * quantity).toFixed(2)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        (${product.price.toFixed(2)} / {product.unit})
                      </span>
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — only when cart has items */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-bold text-foreground text-lg">${totalPrice.toFixed(2)}</span>
            </div>
            {!user ? (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block">
                <Button className="w-full rounded-full h-11 text-sm font-semibold">
                  Sign in to Checkout
                </Button>
              </Link>
            ) : (
              <Button
                className="w-full rounded-full h-11 text-sm font-semibold"
                onClick={() => {
                  if (!profile?.address) {
                    setShowAddressModal(true);
                  } else {
                    setIsOpen(false);
                    setShowCheckout(true);
                  }
                }}
              >
                Checkout
              </Button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
