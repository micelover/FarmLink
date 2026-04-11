import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, SlidersHorizontal, Package, ShoppingCart, MapPin, LocateFixed } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { FarmerProduct, ProductCategory } from "@/types/farmerProduct";
import type { UserProfile } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";

const CATEGORIES: ProductCategory[] = ["Vegetables", "Fruits", "Dairy & Eggs", "Meat", "Pantry", "Other"];
const DISTANCE_OPTIONS = [10, 25, 50, 100] as const;
type DistanceFilter = "All" | (typeof DISTANCE_OPTIONS)[number];

// Haversine distance in miles
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function geocodeText(text: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1&countrycodes=us`,
      { headers: { "Accept-Language": "en", "User-Agent": "FarmLink/1.0" } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

function MarketProductCard({ product }: { product: FarmerProduct }) {
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
          <Link
            to={`/farm/${product.farmerId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary transition-colors mb-1 inline-block"
          >
            {product.farmName}
          </Link>
          <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">
            {product.name}
          </h3>
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

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();

  const [products, setProducts] = useState<FarmerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("farm") ?? "");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");

  // Distance filter state
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("All");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  // farmerId → coords (null means geocoding failed)
  const farmCoordsCache = useRef<Map<string, { lat: number; lng: number } | null>>(new Map());
  const [farmCoordsReady, setFarmCoordsReady] = useState(false);
  const geocodingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FarmerProduct, "id">) }));
      docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setProducts(docs);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Get user's location when distance filter is first activated
  useEffect(() => {
    if (distanceFilter === "All" || userCoords) return;
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      async () => {
        // Geolocation denied — fall back to saved address
        const addressText = [profile?.city, profile?.state].filter(Boolean).join(", ")
          || profile?.address;
        if (addressText) {
          const coords = await geocodeText(addressText);
          if (coords) {
            setUserCoords(coords);
            setLocating(false);
            return;
          }
        }
        setLocationError("Enable location or add a delivery address to use distance filters.");
        setLocating(false);
        setDistanceFilter("All");
      },
      { timeout: 8000 }
    );
  }, [distanceFilter, userCoords, profile]);

  // Geocode farms whenever products change and a distance filter is active
  useEffect(() => {
    if (distanceFilter === "All" || !userCoords || products.length === 0) return;
    if (geocodingRef.current) return;

    const uniqueFarmerIds = [...new Set(products.map((p) => p.farmerId))].filter(
      (id) => !farmCoordsCache.current.has(id)
    );
    if (uniqueFarmerIds.length === 0) {
      setFarmCoordsReady(true);
      return;
    }

    geocodingRef.current = true;
    setFarmCoordsReady(false);

    (async () => {
      for (const farmerId of uniqueFarmerIds) {
        try {
          const snap = await getDoc(doc(db, "users", farmerId));
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            const text =
              data.farmLocation ||
              [data.city, data.state].filter(Boolean).join(", ");
            const coords = text ? await geocodeText(text) : null;
            farmCoordsCache.current.set(farmerId, coords);
          } else {
            farmCoordsCache.current.set(farmerId, null);
          }
        } catch {
          farmCoordsCache.current.set(farmerId, null);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      geocodingRef.current = false;
      setFarmCoordsReady(true);
    })();
  }, [distanceFilter, userCoords, products]);

  const filtered = products.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.farmName.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    let matchesDistance = true;
    if (distanceFilter !== "All" && userCoords && farmCoordsReady) {
      const farmCoords = farmCoordsCache.current.get(p.farmerId);
      if (farmCoords) {
        const d = distanceMiles(userCoords.lat, userCoords.lng, farmCoords.lat, farmCoords.lng);
        matchesDistance = d <= distanceFilter;
      } else {
        matchesDistance = false;
      }
    }

    return matchesCategory && matchesSearch && matchesDistance;
  });

  const isDistanceLoading = distanceFilter !== "All" && (locating || (!userCoords && !locationError) || (userCoords && !farmCoordsReady));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-foreground mb-1">Marketplace</h1>
          <p className="text-muted-foreground">Fresh produce from local farmers in your community</p>

          {/* Search */}
          <div className="relative mt-6 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products or farms…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as ProductCategory | "All")}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Distance filter */}
          <div className="flex items-center gap-2 shrink-0">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDistanceFilter("All")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  distanceFilter === "All"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                Any distance
              </button>
              {DISTANCE_OPTIONS.map((mi) => (
                <button
                  key={mi}
                  onClick={() => setDistanceFilter(mi)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    distanceFilter === mi
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {mi} mi
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location error */}
        {locationError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3 mb-6">
            <LocateFixed className="w-4 h-4 shrink-0" />
            {locationError}
          </div>
        )}

        {/* Loading */}
        {(loading || isDistanceLoading) && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {isDistanceLoading && !loading && (
              <p className="text-sm text-muted-foreground">Finding nearby farms…</p>
            )}
          </div>
        )}

        {/* Empty states */}
        {!loading && !isDistanceLoading && products.length === 0 && (
          <div className="text-center py-24">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No products yet</h3>
            <p className="text-sm text-muted-foreground">Farmers haven't listed any products yet. Check back soon!</p>
          </div>
        )}

        {!loading && !isDistanceLoading && products.length > 0 && filtered.length === 0 && (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No results found</h3>
            <p className="text-sm text-muted-foreground">
              {distanceFilter !== "All"
                ? `No farms within ${distanceFilter} miles match your filters. Try a larger radius.`
                : "Try a different search term or category."}
            </p>
          </div>
        )}

        {/* Product grid */}
        {!loading && !isDistanceLoading && filtered.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filtered.length} {filtered.length === 1 ? "product" : "products"} found
              {distanceFilter !== "All" && userCoords && (
                <span className="ml-1">within {distanceFilter} miles</span>
              )}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((p) => (
                <MarketProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
