import { useState, useEffect } from "react";
import { Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import type { FarmerProduct, FarmerProductDraft, ProductUnit, ProductCategory } from "@/types/farmerProduct";

const UNITS: ProductUnit[] = ["lb", "bunch", "pint", "jar", "each", "dozen", "bag"];
const CATEGORIES: ProductCategory[] = ["Vegetables", "Fruits", "Dairy & Eggs", "Meat", "Pantry", "Other"];

const inputClass =
  "w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors";
const selectClass =
  "w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors";

interface FarmerProductCardProps {
  product: FarmerProduct;
  onUpdate: (id: string, draft: FarmerProductDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function FarmerProductCard({ product, onUpdate, onDelete }: FarmerProductCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FarmerProductDraft>({
    name: product.name,
    price: product.price,
    unit: product.unit,
    category: product.category,
    description: product.description,
    imageUrl: product.imageUrl,
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);

  // Reset draft if product changes from outside (e.g. real-time update)
  useEffect(() => {
    if (!editing) {
      setDraft({
        name: product.name,
        price: product.price,
        unit: product.unit,
        category: product.category,
        description: product.description,
        imageUrl: product.imageUrl,
      });
      setImgError(false);
    }
  }, [product, editing]);

  const set = <K extends keyof FarmerProductDraft>(field: K, value: FarmerProductDraft[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!draft.name.trim()) { setError("Product name is required."); return; }
    if (Number(draft.price) <= 0) { setError("Price must be greater than 0."); return; }
    setError("");
    setSaving(true);
    try {
      await onUpdate(product.id, { ...draft, price: Number(draft.price) });
      setEditing(false);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await onDelete(product.id);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || "Failed to delete.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Image */}
      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {!imgError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Package className="w-10 h-10 text-muted-foreground/30" />
        )}
      </div>

      <div className="p-4">
        {!editing ? (
          /* ── View mode ── */
          <>
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {product.category}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mt-2">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
            )}
            <p className="font-bold text-foreground mt-2">
              ${product.price.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground ml-1">/ {product.unit}</span>
            </p>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-1.5 flex-1"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-3 h-3" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={deleting}
                className={`rounded-full gap-1.5 flex-1 ${confirmDelete ? "text-destructive hover:text-destructive" : ""}`}
                onClick={handleDelete}
                onBlur={() => setConfirmDelete(false)}
              >
                <Trash2 className="w-3 h-3" />
                {deleting ? "Deleting…" : confirmDelete ? "Confirm?" : "Delete"}
              </Button>
            </div>
          </>
        ) : (
          /* ── Edit mode ── */
          <div className="space-y-3">
            {error && (
              <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Name *</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price || ""}
                  onChange={(e) => set("price", Number(e.target.value) as unknown as number)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Unit</label>
                <select
                  value={draft.unit}
                  onChange={(e) => set("unit", e.target.value as ProductUnit)}
                  className={selectClass}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Category</label>
              <select
                value={draft.category}
                onChange={(e) => set("category", e.target.value as ProductCategory)}
                className={selectClass}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Product Photo</label>
              <ImageUpload value={draft.imageUrl} onChange={(url) => set("imageUrl", url)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <textarea
                rows={2}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                disabled={saving}
                className="rounded-full flex-1"
                onClick={handleSave}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full flex-1"
                onClick={() => { setEditing(false); setError(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
