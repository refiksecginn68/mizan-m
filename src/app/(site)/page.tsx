import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Mizanım — Adaletin Dijital Terazisi | AI Hukuk Platformu",
  description:
    "Türkiye'nin ilk çift portallı yapay zekâ hukuk platformu. Avukatlar için emsal arama, dilekçe, UYAP/UETS; vatandaşlar için anlaşılır hukuki rehberlik.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Mizanım — Adaletin Dijital Terazisi",
    description:
      "Emsal, mevzuat, dilekçe, UYAP ve UETS — hepsi tek ekranda. Türkiye'nin çift portallı AI hukuk platformu.",
    images: ["/images/logo.png"],
    locale: "tr_TR",
    type: "website",
  },
};

// Landing sayfası — bölümler istemci bileşeninde (animasyon + modal state)
export default function LandingPage() {
  return <LandingClient />;
}
