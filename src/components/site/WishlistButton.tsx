"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/providers/WishlistProvider";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  label,
  className,
}: {
  productId: string;
  label: string;
  className?: string;
}) {
  const wishlist = useWishlist();
  const selected = wishlist.has(productId);
  return (
    <button
      type="button"
      onClick={() => wishlist.toggle(productId)}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full bg-white shadow transition hover:scale-105",
        className,
      )}
    >
      <Heart
        size={19}
        className={selected ? "fill-gold text-gold-dark" : "text-ink"}
      />
    </button>
  );
}
