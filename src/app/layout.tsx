import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import "@/app/globals.css";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.baseUrl),
  title: {
    default: "Hora | Montres en Tunisie",
    template: "%s | Hora",
  },
  description:
    "Montres contemporaines en Tunisie, livraison nationale et paiement à la livraison.",
  applicationName: "Hora",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestLocale = (await headers()).get("x-hora-locale");
  const locale = requestLocale === "en" ? "en" : "fr";
  return (
    <html lang={locale}>
      <body>
        {children}
      </body>
    </html>
  );
}
