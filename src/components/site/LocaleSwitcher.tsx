"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ locale, long = false }: { locale: Locale; long?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const target = locale === "fr" ? "en" : "fr";
  const path = pathname.replace(/^\/(fr|en)(?=\/|$)/, `/${target}`) || `/${target}`;
  const query = searchParams.toString();
  return (
    <Link
      href={query ? `${path}?${query}` : path}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-ink/15 text-[11px] font-bold tracking-[.12em] transition hover:border-ink hover:bg-ink hover:text-white",
        long ? "h-10 gap-2 px-4" : "h-8 min-w-8 px-2",
      )}
      aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
      hrefLang={target}
    >
      {long ? (target === "en" ? "English" : "Français") : target.toUpperCase()}
    </Link>
  );
}
