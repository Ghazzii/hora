"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Star, Trash2 } from "lucide-react";
import { useToast } from "@/components/admin/Toaster";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 8;
const MAX_EDGE = 2000;

/** Downscales large photos and re-encodes them as WebP before upload. */
async function prepare(file: File): Promise<Blob> {
  if (typeof createImageBitmap === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** next/image only optimises configured hosts; preview anything else unoptimised. */
function canOptimise(url: string) {
  return url.startsWith("/");
}

export function ImageManager({ initial, uploadEnabled }: { initial: string[]; uploadEnabled: boolean }) {
  const [images, setImages] = useState<string[]>(initial);
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { notify } = useToast();

  const add = (url: string) => setImages((current) => (current.includes(url) || current.length >= MAX_IMAGES ? current : [...current, url]));
  const move = (index: number, offset: number) =>
    setImages((current) => {
      const next = [...current];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  async function upload(files: FileList | File[]) {
    const list = [...files].filter((file) => file.type.startsWith("image/")).slice(0, MAX_IMAGES - images.length);
    if (!list.length) return;
    setUploading((count) => count + list.length);
    await Promise.all(list.map(async (file) => {
      try {
        const blob = await prepare(file);
        const body = new FormData();
        body.append("file", blob, file.name);
        const response = await fetch("/api/admin/uploads", { method: "POST", body });
        const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!response.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
        add(data.url);
      } catch (error) {
        notify("error", `${file.name}: ${error instanceof Error ? error.message : "Upload failed."}`);
      } finally {
        setUploading((count) => count - 1);
      }
    }));
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (uploadEnabled && event.dataTransfer.files.length) void upload(event.dataTransfer.files);
  };

  return (
    <div>
      <input type="hidden" name="imageUrls" value={images.join("\n")} />
      {!uploadEnabled && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          Photo upload is off: add <code className="font-semibold">SUPABASE_SERVICE_ROLE_KEY</code> (Supabase → Project Settings → API Keys → secret / service_role) to <code>.env</code> and to Vercel, then restart. Until then, paste image links below.
        </p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((url, index) => (
          <li key={url} className="group relative aspect-[4/5] animate-scale-in overflow-hidden rounded-xl bg-sand ring-1 ring-ink/[.06]">
            <Image src={url} alt="" fill sizes="200px" className="object-cover" unoptimized={!canOptimise(url)} />
            {index === 0 && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-bold text-white"><Star size={10} className="fill-gold text-gold" /> Cover</span>}
            <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              <span className="flex gap-1">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow disabled:opacity-30" aria-label="Move earlier"><ArrowLeft size={14} /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} className="grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow disabled:opacity-30" aria-label="Move later"><ArrowRight size={14} /></button>
              </span>
              <button type="button" onClick={() => setImages((current) => current.filter((item) => item !== url))} className="grid h-8 w-8 place-items-center rounded-full bg-white/95 text-red-700 shadow" aria-label="Remove photo"><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
        {Array.from({ length: uploading }, (_, index) => (
          <li key={`uploading-${index}`} className="skeleton grid aspect-[4/5] place-items-center rounded-xl"><Loader2 size={20} className="animate-spin text-ink/40" /></li>
        ))}
        {images.length + uploading < MAX_IMAGES && uploadEnabled && (
          <li>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn("flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-ink/55 transition hover:border-ink/40 hover:text-ink", dragging ? "border-gold bg-gold/10" : "border-ink/15")}
            >
              <ImagePlus size={22} />
              <span className="px-3 text-center text-xs font-semibold">Upload or drop photos</span>
              <span className="px-3 text-center text-[11px] text-ink/40">Select several at once · {MAX_IMAGES - images.length - uploading} left</span>
            </button>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(event) => { if (event.target.files) void upload(event.target.files); event.target.value = ""; }} />
          </li>
        )}
      </ul>
      {images.length < MAX_IMAGES && (
        <div className="mt-3 flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Image URL</span>
            <Link2 size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              className="field h-11 pl-10"
              value={urlDraft}
              onChange={(event) => setUrlDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (urlDraft.trim()) { add(urlDraft.trim()); setUrlDraft(""); }
                }
              }}
              placeholder="…or paste an image URL (https://…)"
              inputMode="url"
            />
          </label>
          <button type="button" className="btn-outline h-11 px-4 text-xs" onClick={() => { if (urlDraft.trim()) { add(urlDraft.trim()); setUrlDraft(""); } }}>Add</button>
        </div>
      )}
      <p className="mt-2 text-xs text-ink/45">
        The first photo is the cover; use the arrows to reorder. Up to {MAX_IMAGES} photos, portrait 4:5 looks best.
      </p>
    </div>
  );
}
