import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/mockData";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border card-shadow-hover">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.farmName}</p>
        <h3 className="font-semibold text-foreground text-sm leading-tight mb-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-foreground">${product.price.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground ml-1">/ {product.unit}</span>
          </div>
          <Button size="icon" className="h-8 w-8 rounded-full">
            <ShoppingCart className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
