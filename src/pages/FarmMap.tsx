import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { Leaf, MapPin, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import type { UserProfile } from "@/lib/AuthContext";

interface FarmWithCoords extends UserProfile {
  lat: number;
  lng: number;
}

function makeFarmIcon(highlighted = false) {
  const bg = highlighted ? "#15803d" : "#16a34a";
  const size = highlighted ? 38 : 30;
  const half = size / 2;
  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${bg};
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 2px 12px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        transition:all 0.2s;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -(half + 6)],
  });
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`,
      { headers: { "Accept-Language": "en", "User-Agent": "FarmLink/1.0" } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

async function geocodeFarm(farm: UserProfile): Promise<{ lat: number; lng: number } | null> {
  // 1. Try full farm location (street address)
  if (farm.farmLocation) {
    const r = await geocode(farm.farmLocation);
    if (r) return r;
  }
  // 2. Fall back to full street address from delivery address fields
  if (farm.address) {
    const full = [farm.address, farm.city, farm.state, farm.zipCode].filter(Boolean).join(", ");
    const r = await geocode(full);
    if (r) return r;
  }
  // 3. Last resort: city + state only
  if (farm.city || farm.state) {
    const r = await geocode([farm.city, farm.state].filter(Boolean).join(", "));
    if (r) return r;
  }
  return null;
}

// Inner component — must live inside MapContainer to use useMap()
function MapController({ target }: { target: FarmWithCoords | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 13, { duration: 1.0 });
    }
  }, [target, map]);
  return null;
}

// Bay Area center
const BAY_AREA: [number, number] = [37.5, -121.9];
const BAY_AREA_ZOOM = 9;

export default function FarmMap() {
  const [farms, setFarms] = useState<UserProfile[]>([]);
  const [mapped, setMapped] = useState<FarmWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FarmWithCoords | null>(null);

  // Fetch all farmers
  useEffect(() => {
    getDocs(query(collection(db, "users"), where("role", "==", "farmer")))
      .then((snap) => {
        const farmers = snap.docs
          .map((d) => d.data() as UserProfile)
          .filter((f) => f.farmName && (f.farmLocation || f.city));
        setFarms(farmers);
      })
      .catch((err) => console.error("Farm query failed:", err))
      .finally(() => setLoading(false));
  }, []);

  // Geocode each farm sequentially
  useEffect(() => {
    if (!farms.length) return;
    setGeocoding(true);
    let cancelled = false;

    (async () => {
      const results: FarmWithCoords[] = [];
      for (const farm of farms) {
        if (cancelled) break;
        const coords = await geocodeFarm(farm);
        if (coords) results.push({ ...farm, lat: coords.lat, lng: coords.lng });
        setMapped([...results]);
        await new Promise((r) => setTimeout(r, 250));
      }
      if (!cancelled) setGeocoding(false);
    })();

    return () => { cancelled = true; };
  }, [farms]);

  const filteredFarms = mapped.filter((f) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (f.farmName ?? "").toLowerCase().includes(q) ||
      (f.farmLocation ?? "").toLowerCase().includes(q) ||
      (f.farmBio ?? "").toLowerCase().includes(q)
    );
  });

  const handleSelectFarm = (farm: FarmWithCoords) => {
    setSelected((prev) => (prev?.uid === farm.uid ? null : farm));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-72 shrink-0 bg-background border-r border-border overflow-hidden">
          <div className="px-4 pt-5 pb-3 border-b border-border">
            <h1 className="font-bold text-foreground text-lg flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Farm Map
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading
                ? "Loading farms…"
                : geocoding
                ? `Locating farms… ${mapped.length}/${farms.length}`
                : `${mapped.length} farm${mapped.length !== 1 ? "s" : ""} in your area`}
            </p>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search farms…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-full border border-input bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && farms.length === 0 && (
              <div className="text-center py-12 px-4">
                <Leaf className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No farms registered yet.</p>
              </div>
            )}
            {filteredFarms.map((farm) => (
              <button
                key={farm.uid}
                onClick={() => handleSelectFarm(farm)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors ${
                  selected?.uid === farm.uid ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Leaf className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{farm.farmName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {farm.farmLocation || [farm.city, farm.state].filter(Boolean).join(", ")}
                    </p>
                    {farm.farmBio && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{farm.farmBio}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading farm locations…</p>
              </div>
            </div>
          )}

          <MapContainer
            center={BAY_AREA}
            zoom={BAY_AREA_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            <MapController target={selected} />

            {filteredFarms.map((farm) => (
              <Marker
                key={farm.uid}
                position={[farm.lat, farm.lng]}
                icon={makeFarmIcon(selected?.uid === farm.uid)}
                eventHandlers={{ click: () => handleSelectFarm(farm) }}
              >
                <Popup>
                  <div style={{ minWidth: 190, fontFamily: "inherit" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
                      {farm.farmName}
                    </p>
                    {(farm.farmLocation || farm.city) && (
                      <p style={{ fontSize: 12, color: "#666", margin: "0 0 6px" }}>
                        📍 {farm.farmLocation || [farm.city, farm.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {farm.farmBio && (
                      <p style={{ fontSize: 12, color: "#444", margin: "0 0 10px", lineHeight: 1.5 }}>
                        {farm.farmBio}
                      </p>
                    )}
                    <Link
                      to={`/farm/${farm.uid}`}
                      style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none" }}
                    >
                      Visit farm page →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {geocoding && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-lg text-sm text-muted-foreground">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              Locating farms… {mapped.length}/{farms.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
