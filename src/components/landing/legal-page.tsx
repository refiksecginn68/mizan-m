import type { ReactNode } from "react";
import Link from "next/link";

export interface LegalSection {
  /** Anchor kimliği (içindekiler bağlantısı) */
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalPageProps {
  title: string;
  /** "12 Temmuz 2026" biçiminde son güncelleme tarihi */
  updatedAt: string;
  sections: LegalSection[];
}

// Hukuki sayfa iskeleti: başlık + son güncelleme + içindekiler + bölümler + iletişim
export default function LegalPage({ title, updatedAt, sections }: LegalPageProps) {
  return (
    <article>
      <header className="mb-10">
        <span className="inline-flex items-center gap-2 text-[11px] font-inter font-semibold uppercase tracking-[0.25em] text-gold-500 mb-4">
          <span aria-hidden className="h-px w-8 bg-gold-500/60" />
          Yasal
        </span>
        <h1 className="font-heading font-bold text-cream leading-tight [font-size:clamp(2rem,4vw,3rem)]">
          {title}
        </h1>
        <p className="font-inter text-sm text-cream/45 mt-3">Son güncelleme: {updatedAt}</p>
      </header>

      {/* İçindekiler */}
      <nav aria-label="İçindekiler" className="bg-navy-800 border border-navy-700 rounded-xl p-6 mb-12">
        <h2 className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-gold-500 mb-4">
          İçindekiler
        </h2>
        <ol className="space-y-2 list-decimal list-inside">
          {sections.map((s) => (
            <li key={s.id} className="font-inter text-sm text-cream/70">
              <a
                href={`#${s.id}`}
                className="hover:text-gold-300 transition-colors underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500 rounded"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Bölümler */}
      <div className="space-y-12">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-cream mb-4">
              {i + 1}. {s.title}
            </h2>
            <div className="font-inter text-[15px] md:text-base text-cream/70 leading-[1.8] space-y-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-cream [&_strong]:font-semibold">
              {s.content}
            </div>
          </section>
        ))}
      </div>

      {/* İletişim */}
      <footer className="mt-16 pt-8 border-t border-navy-800">
        <p className="font-inter text-sm text-cream/55 leading-relaxed">
          Bu metinle ilgili soru, talep ve başvurularınız için{" "}
          <Link href="/iletisim" className="text-gold-300 hover:text-gold-100 underline underline-offset-2">
            iletişim sayfamızdan
          </Link>{" "}
          bize ulaşabilirsiniz.
        </p>
      </footer>
    </article>
  );
}
