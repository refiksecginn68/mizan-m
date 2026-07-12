"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface CtaBandProps {
  /** Avukat girişi butonuna basılınca KVKK modalını açar */
  onAvukatGiris: () => void;
}

// Kapanış CTA bandı — koyu zemin, altın çerçeve vurgusu
export default function CtaBand({ onAvukatGiris }: CtaBandProps) {
  return (
    <section className="bg-navy-900 py-20 md:py-28">
      <motion.div
        className="mx-auto max-w-4xl px-5 md:px-8 text-center relative"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Köşe altın çerçeveler */}
        <div aria-hidden className="absolute -top-6 left-0 w-12 h-12 border-l border-t border-gold-500/50" />
        <div aria-hidden className="absolute -bottom-6 right-0 w-12 h-12 border-r border-b border-gold-500/50" />

        <h2 className="font-heading font-bold text-cream leading-tight [font-size:clamp(2rem,3.5vw,3rem)]">
          Dosyanızı bugün açın.{" "}
          <span className="text-gold-400">Gerisini Mizanım halletsin.</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button
            type="button"
            onClick={onAvukatGiris}
            className="px-8 py-4 rounded-md font-inter text-sm md:text-base font-semibold text-navy-950 bg-gold-500 hover:bg-gold-400 transition-all hover:-translate-y-1 shadow-lg shadow-gold-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
          >
            Avukat Girişi
          </button>
          <Link
            href="/giris?role=vatandas"
            className="px-8 py-4 rounded-md font-inter text-sm md:text-base text-cream border border-cream/25 hover:border-gold-500/60 hover:text-gold-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
          >
            Vatandaş Girişi
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
