import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SiteProviders } from "@/providers/SiteProviders";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <SiteProviders>
      <Header locale={locale} />
      <main id="main-content">{children}</main>
      <Footer locale={locale} />
    </SiteProviders>
  );
}
