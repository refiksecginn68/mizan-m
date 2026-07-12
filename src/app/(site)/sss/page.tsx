import type { Metadata } from "next";
import SssClient from "./sss-client";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular — Mizanım",
  description:
    "Mizanım hakkında merak edilenler: veri güvenliği, kotalar, UYAP entegrasyonu, abonelik iptali, plan farkları ve daha fazlası.",
  alternates: { canonical: "/sss" },
  openGraph: {
    title: "Sık Sorulan Sorular — Mizanım",
    description: "Kısa, net ve dürüst yanıtlar.",
    images: ["/images/logo.png"],
  },
};

// SSS sayfası — genişletilmiş soru listesi istemci bileşeninde
export default function SssPage() {
  return <SssClient />;
}
