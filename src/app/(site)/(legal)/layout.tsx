import type { ReactNode } from "react";

// Hukuki sayfalar ortak düzeni: dar sütun, okunabilir tipografi.
// Sayfalar kendi başlık/tarih/içindekiler bloklarını LegalPage bileşeniyle kurar.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-navy-950 pt-32 md:pt-40 pb-20 md:pb-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">{children}</div>
    </div>
  );
}
