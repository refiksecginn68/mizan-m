"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Star } from "lucide-react";
import SectionHeading from "@/components/landing/section-heading";

interface Plan {
  name: string;
  price: string;
  period?: string;
  quota: string;
  highlights: string[];
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
}

// Fiyatlar /fiyatlandirma sayfasındaki güncel planlarla hizalıdır
const PLANS: Plan[] = [
  {
    name: "Vatandaş",
    price: "299₺",
    period: "/ay",
    quota: "50 AI sorgu / ay",
    highlights: ["Hukuki soru-cevap", "Belge analizi", "Dilekçe taslağı"],
    ctaLabel: "Hemen Başla",
    ctaHref: "/kayit",
  },
  {
    name: "Avukat Pro",
    price: "1.990₺",
    period: "/ay",
    quota: "750 AI sorgu / ay",
    highlights: ["MizanAI asistan", "Sınırsız emsal arama", "CRM + takvim"],
    ctaLabel: "14 Gün Ücretsiz Dene",
    ctaHref: "/kayit?role=avukat",
  },
  {
    name: "Avukat Max",
    price: "3.990₺",
    period: "/ay",
    quota: "2.000 sorgu + UYAP/UETS",
    highlights: ["Pro'daki her şey", "UYAP entegrasyonu", "UETS e-tebligat takibi"],
    ctaLabel: "14 Gün Ücretsiz Dene",
    ctaHref: "/kayit?role=avukat&plan=max",
    popular: true,
  },
  {
    name: "Büro",
    price: "İletişime Geç",
    quota: "5+ kullanıcı, havuz kota",
    highlights: ["Çoklu kullanıcı", "Ortak kota havuzu", "Öncelikli destek"],
    ctaLabel: "İletişime Geç",
    ctaHref: "/iletisim",
  },
];

// Fiyatlandırma önizleme: 4 kart, Max kartı "En Popüler" rozetiyle vurgulu
export default function PricingPreview() {
  return (
    <section className="bg-navy-900 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Fiyatlandırma"
          title="Her ölçeğe uygun bir plan"
          description="Bireysel sorudan kurumsal büroya — ihtiyacınız kadar ödeyin."
        />

        <ul className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-14">
          {PLANS.map((plan, i) => (
            <motion.li
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className={`relative flex flex-col rounded-xl p-6 bg-navy-800 transition-transform duration-300 hover:-translate-y-1 ${
                plan.popular ? "border-2 border-gold-500" : "border border-navy-700"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold-500 text-navy-950 font-inter text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                  <Star aria-hidden className="w-3 h-3 fill-navy-950" /> En Popüler
                </span>
              )}

              <h3 className="font-inter text-sm font-semibold uppercase tracking-[0.15em] text-cream/60">
                {plan.name}
              </h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className={`font-heading font-bold text-cream ${plan.period ? "text-3xl" : "text-2xl"}`}>
                  {plan.price}
                </span>
                {plan.period && <span className="font-inter text-sm text-cream/50">{plan.period}</span>}
              </p>
              <p className="font-inter text-xs text-gold-300 mt-1.5">{plan.quota}</p>

              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 font-inter text-sm text-cream/70">
                    <Check aria-hidden className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`mt-6 py-3 rounded-md font-inter text-sm font-semibold text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
                  plan.popular
                    ? "bg-gold-500 text-navy-950 hover:bg-gold-400"
                    : "border border-navy-700 text-cream/80 hover:border-gold-500/50 hover:text-cream"
                }`}
              >
                {plan.ctaLabel}
              </Link>
            </motion.li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-4 mt-10">
          <p className="font-inter text-xs text-cream/45">
            Tüm planlar KDV dahildir. Yıllık ödemede %20 indirim.
          </p>
          <Link
            href="/fiyatlandirma"
            className="inline-flex items-center gap-2 font-inter text-sm text-gold-300 hover:text-gold-100 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500 rounded"
          >
            Tüm Planları Karşılaştır
            <ArrowRight aria-hidden className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
