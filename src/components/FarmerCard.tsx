import { MapPin, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Farmer } from "@/data/mockData";

interface FarmerCardProps {
  farmer: Farmer;
  onView?: () => void;
}

export default function FarmerCard({ farmer, onView }: FarmerCardProps) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border card-shadow-hover p-6">
      <div className="flex items-start gap-4 mb-4">
        <img
          src={farmer.image}
          alt={farmer.name}
          className="w-14 h-14 rounded-full object-cover shrink-0"
        />
        <div>
          <h3 className="font-semibold text-foreground">{farmer.name}</h3>
          <p className="text-sm font-medium text-primary">{farmer.farmName}</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{farmer.location}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
        {farmer.bio}
      </p>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium text-foreground">{farmer.rating}</span>
        </div>
        <div className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{farmer.productsCount} products</span>
        </div>
      </div>

      <Button variant="outline" className="w-full rounded-full text-sm" onClick={onView}>
        View Farm
      </Button>
    </div>
  );
}
