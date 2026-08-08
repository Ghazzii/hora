"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const target = locale === "fr" ? "en" : "fr";
  const href = pathname.replace(/^\/(fr|en)(?=\/|$)/, `/${target}`);
  return (
    <Link
      href={href || `/${target}`}
      className="rounded-sm border border-current/25 px-2 py-1 text-xs font-bold"
      aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
    >
      {target.toUpperCase()}
    </Link>
  );
}
