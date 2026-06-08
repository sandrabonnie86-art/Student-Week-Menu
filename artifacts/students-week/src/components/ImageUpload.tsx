import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link, X, ImageOff } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Image" }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    onChange("");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">{label}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${tab === "url" ? "bg-primary/20 text-primary" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Link className="h-3 w-3" /> URL
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${tab === "upload" ? "bg-primary/20 text-primary" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Upload className="h-3 w-3" /> Upload
          </button>
        </div>
      </div>

      {tab === "url" ? (
        <div className="flex gap-2">
          <Input
            value={value.startsWith("data:") ? "" : value}
            onChange={e => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="bg-background/50 border-primary/20 text-white text-sm"
          />
          {value && (
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-red-400 shrink-0" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-primary/20 rounded-lg cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-6 w-6 text-zinc-500 mb-1" />
            <p className="text-xs text-zinc-400">Click to upload (max 2 MB)</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">JPEG, PNG, WebP</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {value && (
        <div className="relative mt-2">
          <div className="relative w-full h-28 rounded-lg overflow-hidden border border-primary/15 bg-background/30">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <button
              type="button"
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 transition-colors"
              onClick={handleClear}
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {!value && (
        <div className="flex items-center justify-center h-12 rounded-lg border border-dashed border-zinc-700/50 bg-background/20">
          <ImageOff className="h-4 w-4 text-zinc-600 mr-2" />
          <span className="text-xs text-zinc-600">No image set</span>
        </div>
      )}
    </div>
  );
}
