import { NextResponse } from "next/server";
import { canAccessAdmin, getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, storageConfigured, uploadProductImage } from "@/lib/storage";

export const runtime = "nodejs";

/** Magic-byte check so a renamed file cannot pose as an image. */
function looksLikeImage(bytes: Uint8Array, type: string) {
  const starts = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (type === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (type === "image/png") return starts(0x89, 0x50, 0x4e, 0x47);
  if (type === "image/webp") return starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45;
  if (type === "image/avif") return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  return false;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!canAccessAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!storageConfigured()) return NextResponse.json({ error: "Photo upload is not configured. Paste an image URL instead." }, { status: 501 });
  if (!(await checkRateLimit(`upload:${user!.id}`, 30, 60_000)).allowed) return NextResponse.json({ error: "Too many uploads. Wait a minute." }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (!(file.type in ALLOWED_IMAGE_TYPES)) return NextResponse.json({ error: "Use a JPEG, PNG, WebP or AVIF image." }, { status: 415 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Images must be 4 MB or smaller." }, { status: 413 });
  const bytes = await file.arrayBuffer();
  if (!looksLikeImage(new Uint8Array(bytes.slice(0, 16)), file.type)) return NextResponse.json({ error: "This file is not a valid image." }, { status: 415 });

  try {
    const url = await uploadProductImage(bytes, file.type as keyof typeof ALLOWED_IMAGE_TYPES);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Product image upload failed", message);
    return NextResponse.json({ error: message.startsWith("Storage rejected") ? message : "Upload failed. Please try again." }, { status: 502 });
  }
}
