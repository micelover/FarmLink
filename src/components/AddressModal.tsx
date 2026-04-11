import { useState, useEffect, useRef } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, Home, Hash, X, ChevronDown } from "lucide-react";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  /** When true, the modal cannot be dismissed — address is required to proceed */
  required?: boolean;
}

interface NominatimResult {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const inputClass =
  "w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors";

export default function AddressModal({ isOpen, onClose, onSave, required = false }: AddressModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Autocomplete
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  // Pre-fill if editing existing address
  useEffect(() => {
    if (isOpen) {
      setAddress(profile?.address ?? "");
      setCity(profile?.city ?? "");
      setState(profile?.state ?? "");
      setZipCode(profile?.zipCode ?? "");
      setError("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen, profile]);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (!userTyping || address.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&countrycodes=us&limit=6`,
          { headers: { "Accept-Language": "en", "User-Agent": "FarmLink/1.0" } }
        );
        const data: NominatimResult[] = await res.json();
        // Only show results that have a road (actual addresses)
        const filtered = data.filter((d) => d.address.road);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [address, userTyping]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionRef.current && !suggestionRef.current.contains(e.target as Node) &&
        addressRef.current && !addressRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSuggestion = (s: NominatimResult) => {
    const a = s.address;
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    setAddress(street || s.display_name.split(",")[0].trim());
    setCity(a.city || a.town || a.village || a.county || "");
    setState(a.state || "");
    setZipCode(a.postcode || "");
    setShowSuggestions(false);
    setSuggestions([]);
    setUserTyping(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) { setError("Street address is required."); return; }
    if (!zipCode.trim()) { setError("Zip code is required."); return; }
    if (!user) return;

    setSaving(true);
    setError("");
    try {
      await setDoc(doc(db, "users", user.uid), {
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
      }, { merge: true });
      await refreshProfile();
      onSave();
      onClose();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-foreground text-lg">Delivery Address</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {required
                ? "A delivery address is required to use FarmLink."
                : "Where should we deliver your order?"}
            </p>
          </div>
          {!required && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Street address with autocomplete */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Street Address <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <input
                ref={addressRef}
                type="text"
                placeholder="123 Main St"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setUserTyping(true); }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className={inputClass}
                autoComplete="off"
              />
              {loadingSuggestions && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  {suggestions.map((s, i) => {
                    const a = s.address;
                    const street = [a.house_number, a.road].filter(Boolean).join(" ");
                    const locality = [a.city || a.town || a.village, a.state].filter(Boolean).join(", ");
                    return (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-start gap-2.5 border-b border-border last:border-0"
                        onMouseDown={() => selectSuggestion(s)}
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{street || s.display_name.split(",")[0]}</p>
                          {locality && <p className="text-xs text-muted-foreground">{locality}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="San Ramon"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
                autoComplete="address-level2"
              />
            </div>
          </div>

          {/* State + Zip in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">State</label>
              <div className="relative">
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors appearance-none"
                >
                  <option value="">Select…</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Zip Code <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="94583"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className={inputClass}
                  autoComplete="postal-code"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving} className="rounded-full flex-1 h-11">
              {saving ? "Saving…" : "Save Address"}
            </Button>
            {!required && (
              <Button type="button" variant="ghost" className="rounded-full" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
