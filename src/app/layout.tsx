import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { MetaPixel } from "@/components/MetaPixel";
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
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
