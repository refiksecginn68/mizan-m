"use client";

import { motion } from "framer-motion";
import { Upload, BrainCircuit, FileCheck2 } from "lucide-react";
import SectionHeading from "@/components/landing/section-heading";

interface Step {
  icon: typeof Upload;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: Upload,
    title: "Dosyayı yükle",
    description: "PDF, DOCX yükleyin veya sorunuzu doğrudan yazın.",
  },
  {
    icon: BrainCircuit,
    title: "Mizanım analiz eder",
    description: "Emsal tarar, mevzuatı eşleştirir, riski çıkarır.",
  },
  {
    icon: FileCheck2,
    title: "Sonucu al",
    description: "Dilekçe, özet veya net bir cevap — dakikalar içinde.",
  },
];

// Nasıl Çalışır: 3 adımlı yatay zaman çizelgesi, altın kesikli bağlantılarla
export default function HowItWorks() {
  return (
    <section className="bg-navy-950 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Süreç"
          title="Üç adımda sonuç"
          description="Karmaşık hukuki süreçleri sade bir akışa indirdik."
        />

        <ol className="relative grid md:grid-cols-3 gap-12 md:gap-8 mt-16">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              className="relative flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.55, delay: i * 0.2, ease: "easeOut" }}
            >
              {/* Adımlar arası altın kesikli bağlantı (yalnız masaüstü) */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden md:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)] border-t border-dashed border-gold-500/40"
                />
              )}

              <span className="relative w-16 h-16 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center mb-6">
                <step.icon aria-hidden className="w-7 h-7 text-gold-500" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-500 text-navy-950 font-inter text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </span>

              <h3 className="font-heading text-xl font-bold text-cream mb-2">{step.title}</h3>
              <p className="font-inter text-sm text-cream/55 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
