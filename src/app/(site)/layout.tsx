import type { ReactNode } from "react";
// Landing gövde fontu: Inter (yalnızca public sayfalarda yüklenir)
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import LenisProvider from "@/components/providers/lenis-provider";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/landing/site-footer";

// Public (site) düzeni: header + smooth scroll + footer.
// /buro ve /panel iç uygulamaları bu düzenin dışındadır.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <LenisProvider>
      <div className="bg-navy-950 min-h-screen font-inter">
        <SiteHeader />
        <main id="icerik">{children}</main>
        <SiteFooter />
      </div>
    </LenisProvider>
  );
}
