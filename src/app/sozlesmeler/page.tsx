import Link from "next/link";
import type { Metadata } from "next";
import { listLegalDocs } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Sözleşmeler ve KVKK Metinleri — Mizanım",
  description: "Mizanım kullanım koşulları, gizlilik ve KVKK metinlerinin tam listesi.",
};

export default function SozlesmelerIndexPage() {
  const docs = listLegalDocs();
  return (
    <article className="max-w-3xl mx-auto px-5 py-16">
      <h1 className="font-heading text-3xl font-bold text-cream mb-8">
        Sözleşmeler ve KVKK Metinleri
      </h1>
      <ul className="space-y-3">
        {docs.map((d) => (
          <li key={d.slug}>
            <Link
              href={`/sozlesmeler/${d.slug}`}
              className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3 hover:border-gold-500/50 transition-colors"
            >
              <span className="font-inter text-sm text-cream">{d.baslik}</span>
              <span className="font-inter text-xs text-cream/50">
                {d.versiyon} · {d.yururlukTarihi}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
