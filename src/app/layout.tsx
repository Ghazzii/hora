import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "@/app/globals.css";
import { publicEnv } from "@/lib/env";

const display = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.baseUrl),
  title: {
    default: "Hora | Montres en Tunisie",
    template: "%s | Hora",
  },
  description:
    "Montres contemporaines en Tunisie, livraison nationale et paiement à la livraison.",
  applicationName: "Hora",
  icons: { icon: { url: "/favicon.png", type: "image/png", sizes: "64x64" }, apple: "/apple-touch-icon.png" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F7F4EE",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestLocale = (await headers()).get("x-hora-locale");
  const locale = requestLocale === "en" ? "en" : "fr";
  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Lets CSS hide reveal-on-scroll content only when JavaScript can reveal it again. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
