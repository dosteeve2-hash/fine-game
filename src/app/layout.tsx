import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "../ui/RegisterServiceWorker";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], weight: ["700", "900"], variable: "--font-playfair" });
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-outfit" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "FINE Game",
  description: "Joue, investis, deviens libre : le jeu de plateau d’éducation financière, jouable hors ligne.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" }
};

export const viewport: Viewport = {
  themeColor: "#070e1f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${playfair.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
