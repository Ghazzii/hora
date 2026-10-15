"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/providers/WishlistProvider";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  label,
  className,
  size = "md",
}: {
  productId: string;
  label: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const wishlist = useWishlist();
  const selected = wishlist.has(productId);
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (!selected) setPop(true);
        wishlist.toggle(productId);
      }}
      onAnimationEnd={() => setPop(false)}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "grid place-items-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur transition duration-300 hover:scale-105 hover:bg-white active:scale-90",
        size === "lg" ? "h-12 w-12" : "h-10 w-10",
        className,
      )}
    >
      <Heart
        size={size === "lg" ? 20 : 17}
        className={cn("transition-colors duration-300", selected ? "fill-gold text-gold-dark" : "text-ink", pop && "animate-bump")}
      />
    </button>
  );
}
