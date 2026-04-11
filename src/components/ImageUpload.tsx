import { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFile = (file: File) => {
    if (!user) { setError("You must be logged in."); return; }
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }

    setError("");
    setUploading(true);
    setProgress(0);

    const path = `products/${user.uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        console.error("Upload error:", err.code, err.message);
        setError(`${err.code}: ${err.message}`);
        setUploading(false);
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((url) => {
          onChange(url);
          setUploading(false);
          setProgress(0);
        }).catch((err) => {
          setError(err.message);
          setUploading(false);
        });
      }
    );
  };

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value && !uploading && (
        <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
          <img src={value} alt="Product" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="rounded-xl border-2 border-dashed border-primary/40 bg-muted/30 aspect-video flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Uploading… {progress}%</p>
          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Drop zone — shown when no image and not uploading */}
      {!value && !uploading && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-xl border-2 border-dashed border-border bg-muted/30 aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 hover:border-primary/40 transition-colors"
        >
          <ImagePlus className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">Click or drag to upload</p>
          <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP up to 5 MB</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
