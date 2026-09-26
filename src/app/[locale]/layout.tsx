import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MetaPixel } from "@/components/MetaPixel";
import { SiteProviders } from "@/providers/SiteProviders";
import { isLocale } from "@/lib/i18n";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const french = locale === "fr";
  return {
    title: french ? "Montres en Tunisie" : "Watches in Tunisia",
    description: french
      ? "Montres contemporaines, livraison partout en Tunisie et paiement à la livraison."
      : "Contemporary watches, delivery throughout Tunisia, and cash on delivery.",
    openGraph: {
      type: "website",
      url: `${publicEnv.baseUrl}/${locale}`,
      locale: french ? "fr_TN" : "en_TN",
      siteName: "Hora",
    },
  };
}

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
      <a href="#main-content" className="skip-link">{locale === "fr" ? "Aller au contenu" : "Skip to content"}</a>
      <Header locale={locale} />
      <main id="main-content">{children}</main>
      <Footer locale={locale} />
      <MetaPixel />
    </SiteProviders>
  );
}
