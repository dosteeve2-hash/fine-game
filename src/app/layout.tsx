import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Lilita_One, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "../ui/RegisterServiceWorker";
import startupImages from "./startup-images.json";

const lilita = Lilita_One({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-lilita" });
const outfit = Outfit({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"], variable: "--font-outfit" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "600"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "FINE Game",
  description: "Jouez avec l'argent pour apprendre à le garder. Un jeu de plateau éducatif jouable hors ligne.",
  manifest: "/manifest.webmanifest",
  applicationName: "FINE",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/favicon.ico", sizes: "48x48" }], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  appleWebApp: { capable: true, title: "FINE", statusBarStyle: "black-translucent", startupImage: startupImages },
  formatDetection: { telephone: false, email: false, address: false },
  other: { "apple-mobile-web-app-capable": "yes", "mobile-web-app-capable": "yes" }
};

export const viewport: Viewport = {
  themeColor: "#f5efdf",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${lilita.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
