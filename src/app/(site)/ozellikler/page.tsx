import type { Metadata } from "next";
import OzelliklerClient from "./ozellikler-client";

export const metadata: Metadata = {
  title: "Özellikler — Mizanım | Avukat Portalı ve Vatandaş Paneli",
  description:
    "MizanAI asistan, sınırsız emsal arama, dilekçe üretimi, belge analizi, CRM, akıllı takvim, UYAP ve UETS entegrasyonu. Vatandaşlar için soru-cevap ve belge analizi.",
  alternates: { canonical: "/ozellikler" },
  openGraph: {
    title: "Mizanım Özellikleri",
    description: "Avukatlar ve vatandaşlar için yapay zekâ destekli hukuk araçları.",
    images: ["/images/logo.png"],
  },
};

// Özellikler sayfası — sekmeli detay istemci bileşeninde
export default function OzelliklerPage() {
  return <OzelliklerClient />;
}
