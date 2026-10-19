import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "../ui/RegisterServiceWorker";
import startupImages from "./startup-images.json";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], weight: ["700", "900"], variable: "--font-playfair" });
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-outfit" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "FINE Game",
  description: "Joue, investis, deviens libre : le jeu de plateau d’éducation financière, jouable hors ligne.",
  manifest: "/manifest.webmanifest",
  applicationName: "FINE",
  icons: { icon: "/icon.svg", apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  appleWebApp: { capable: true, title: "FINE", statusBarStyle: "black-translucent", startupImage: startupImages },
  formatDetection: { telephone: false, email: false, address: false },
  other: { "apple-mobile-web-app-capable": "yes", "mobile-web-app-capable": "yes" }
};

export const viewport: Viewport = {
  themeColor: "#070e1f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark"
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
