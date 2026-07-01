import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import CookieBanner from "@/components/shared/CookieBanner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  weight: ["300", "400", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a2744" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1729" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Mizanım — AI Destekli Hukuk Platformu",
  description:
    "Türkiye'nin ilk çift kapılı AI hukuk platformu. Avukatlar ve vatandaşlar için emsal arama, belge analizi, dilekçe üretimi ve daha fazlası.",
  keywords: ["hukuk", "avukat", "yapay zeka", "dilekçe", "emsal", "mevzuat", "UYAP"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mizanım",
    startupImage: [
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "Mizanım — AI Destekli Hukuk Platformu",
    description: "Hukuki süreçlerinizi AI ile kolaylaştırın",
    locale: "tr_TR",
    type: "website",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#1a2744",
    "msapplication-TileImage": "/icons/icon-144.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${playfair.variable} ${sourceSerif.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
        <PWAInstallPrompt />
        <CookieBanner />
      </body>
    </html>
  );
}
