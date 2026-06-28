import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  icons: { icon: "/favicon.png", apple: "/logo.png" },
  title: "Mizanım — AI Destekli Hukuk Platformu",
  description:
    "Türkiye'nin ilk çift kapılı AI hukuk platformu. Avukatlar ve vatandaşlar için emsal arama, belge analizi, dilekçe üretimi ve daha fazlası.",
  keywords: ["hukuk", "avukat", "yapay zeka", "dilekçe", "emsal", "mevzuat", "UYAP"],
  openGraph: {
    title: "Mizanım — AI Destekli Hukuk Platformu",
    description: "Hukuki süreçlerinizi AI ile kolaylaştırın",
    locale: "tr_TR",
    type: "website",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
