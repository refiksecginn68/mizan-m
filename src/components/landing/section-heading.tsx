"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  /** Başlığın üstündeki küçük altın etiket */
  eyebrow: string;
  /** Bölüm başlığı */
  title: string;
  /** Opsiyonel açıklama satırı */
  description?: string;
  /** Hizalama — varsayılan ortalı */
  align?: "center" | "left";
}

// Ortak bölüm başlığı: eyebrow + Playfair başlık + opsiyonel açıklama
export default function SectionHeading({ eyebrow, title, description, align = "center" }: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <motion.div
      className={`flex flex-col gap-4 ${alignClass}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <span className="inline-flex items-center gap-2 text-[11px] font-inter font-semibold uppercase tracking-[0.25em] text-gold-500">
        <span aria-hidden className="h-px w-8 bg-gold-500/60" />
        {eyebrow}
        {align === "center" && <span aria-hidden className="h-px w-8 bg-gold-500/60" />}
      </span>
      <h2 className="font-heading text-cream font-bold leading-tight [font-size:clamp(2rem,3.5vw,3rem)]">
        {title}
      </h2>
      {description && (
        <p className={`font-inter text-cream/60 text-base md:text-lg leading-relaxed max-w-2xl ${align === "center" ? "mx-auto" : ""}`}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
