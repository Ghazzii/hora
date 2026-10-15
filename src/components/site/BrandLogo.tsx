import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ tone = "dark", className }: { tone?: "dark" | "gold"; className?: string }) {
  const gold = tone === "gold";
  return (
    <span role="img" aria-label="HORA — Time. Redefined." className={cn("inline-flex shrink-0 items-center gap-3", className)}>
      <Image src={`/images/brand/hora-mark-${gold ? "gold" : "black"}.png`} alt="" width={gold ? 476 : 155} height={gold ? 505 : 159} unoptimized className="h-10 w-auto sm:h-12" />
      <Image src={`/images/brand/hora-wordmark-${gold ? "gold" : "black"}.png`} alt="" width={gold ? 410 : 159} height={gold ? 51 : 25} unoptimized className="h-auto w-[88px] sm:w-[102px]" />
    </span>
  );
}
