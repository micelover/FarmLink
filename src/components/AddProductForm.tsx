import { useState } from "react";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import type { FarmerProductDraft, ProductUnit, ProductCategory } from "@/types/farmerProduct";

const UNITS: ProductUnit[] = ["lb", "bunch", "pint", "jar", "each", "dozen", "bag"];
const CATEGORIES: ProductCategory[] = ["Vegetables", "Fruits", "Dairy & Eggs", "Meat", "Pantry", "Other"];

const emptyDraft: FarmerProductDraft = {
  name: "",
  price: 0,
  unit: "lb",
  category: "Vegetables",
  description: "",
  imageUrl: "",
};

const inputClass =
  "w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors";
const selectClass =
  "w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors";

interface AddProductFormProps {
  onAdd: (draft: FarmerProductDraft) => Promise<void>;
  onCancel: () => void;
}

export default function AddProductForm({ onAdd, onCancel }: AddProductFormProps) {
  const [draft, setDraft] = useState<FarmerProductDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FarmerProductDraft>(field: K, value: FarmerProductDraft[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) { setError("Product name is required."); return; }
    if (Number(draft.price) <= 0) { setError("Price must be greater than 0."); return; }
    setError("");
    setSaving(true);
    try {
      await onAdd({ ...draft, price: Number(draft.price) });
      setDraft(emptyDraft);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || "Failed to add product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-foreground">New Product</h3>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name — full width */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Product Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="Heirloom Tomatoes"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Price ($) <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="4.99"
            value={draft.price || ""}
            onChange={(e) => set("price", Number(e.target.value) as unknown as number)}
            className={inputClass}
          />
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Unit</label>
          <select
            value={draft.unit}
            onChange={(e) => set("unit", e.target.value as ProductUnit)}
            className={selectClass}
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
          <select
            value={draft.category}
            onChange={(e) => set("category", e.target.value as ProductCategory)}
            className={selectClass}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Image upload — full width */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1.5">Product Photo</label>
          <ImageUpload value={draft.imageUrl} onChange={(url) => set("imageUrl", url)} />
        </div>

        {/* Description — full width */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
          <textarea
            rows={2}
            placeholder="Tell customers about this product..."
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={saving} className="rounded-full px-6">
          {saving ? "Adding…" : "Add Product"}
        </Button>
        <Button type="button" variant="ghost" className="rounded-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
