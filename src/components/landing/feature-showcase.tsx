"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import SectionHeading from "@/components/landing/section-heading";

interface Feature {
  eyebrow: string;
  title: string;
  image: string;
  alt: string;
  points: string[];
}

const FEATURES: Feature[] = [
  {
    eyebrow: "Arama",
    title: "Emsal & Mevzuat Arama",
    image: "/images/screens/emsal-arama.png",
    alt: "Mizanım emsal arama ekranı",
    points: [
      "Milyonlarca içtihatta sınırsız arama — kotadan düşmez",
      "PDF/UDF indirme ve tek tıkla AI karar özeti",
      "Mevzuat ve emsal tek sorguda, yan yana",
    ],
  },
  {
    eyebrow: "Asistan",
    title: "MizanAI Hukuk Asistanı",
    image: "/images/screens/mizanai.png",
    alt: "MizanAI sohbet ekranı",
    points: [
      "Dosyanızın bağlamını tanır, ona göre yanıtlar",
      "Madde ve karar atıflarıyla dayanak gösterir",
      "7/24, saniyeler içinde",
    ],
  },
  {
    eyebrow: "Dilekçe",
    title: "Dilekçe Motoru",
    image: "/images/screens/dilekce.png",
    alt: "Dilekçe oluşturma ekranı",
    points: [
      "Olay özetinden kurumsal formatta taslak",
      "Emsal destekli gerekçe bölümleri",
      "Düzenleyin, DOCX/UDF olarak indirin",
    ],
  },
  {
    eyebrow: "Entegrasyon",
    title: "UYAP + UETS Aktarım",
    image: "/images/screens/uyap.png",
    alt: "UYAP dosya aktarım ekranı",
    points: [
      "Tarayıcı eklentisiyle dosyalar tek tıkla panelde",
      "E-tebligatlar dosyalarınızla otomatik eşleşir",
      "Süreler hesaplanır, takvime işlenir",
    ],
  },
  {
    eyebrow: "Finans",
    title: "Finans Yönetimi",
    image: "/images/screens/finans.png",
    alt: "Finans yönetimi ekranı",
    points: [
      "Vekâlet ücreti, masraf ve tahsilat tek tabloda",
      "Dosya bazında gelir-gider görünümü",
      "Geciken ödemeler için hatırlatma",
    ],
  },
];

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const reversed = index % 2 === 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`grid lg:grid-cols-2 gap-8 lg:gap-14 items-center ${reversed ? "lg:[direction:rtl]" : ""}`}
    >
      {/* Ekran görüntüsü */}
      <div className="[direction:ltr] relative rounded-xl overflow-hidden border border-navy-700 bg-navy-900 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div aria-hidden className="absolute top-3 left-3 w-8 h-8 border-l border-t border-gold-500/40 z-10" />
        <div aria-hidden className="absolute bottom-3 right-3 w-8 h-8 border-r border-b border-gold-500/40 z-10" />
        <Image
          src={feature.image}
          alt={feature.alt}
          width={1440}
          height={810}
          sizes="(min-width: 1024px) 600px, 100vw"
          className="w-full h-auto"
        />
      </div>

      {/* Metin */}
      <div className="[direction:ltr] flex flex-col gap-4">
        <span className="inline-flex items-center gap-2 text-[11px] font-inter font-semibold uppercase tracking-[0.25em] text-gold-500">
          <span aria-hidden className="h-px w-8 bg-gold-500/60" />
          {feature.eyebrow}
        </span>
        <h3 className="font-heading text-2xl md:text-3xl font-bold text-cream">{feature.title}</h3>
        <ul className="flex flex-col gap-3 mt-1">
          {feature.points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 font-inter text-[15px] text-cream/80 leading-relaxed">
              <Check aria-hidden className="w-4 h-4 text-gold-500 mt-1 flex-shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

// Özellikler: her satırda gerçek uygulama ekranı + kısa açıklama, sırayla sağ/sol
export default function FeatureShowcase() {
  return (
    <section id="ozellikler" className="bg-navy-900 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Platform"
          title="Sahada ne varsa, ekranda o var"
          description="Uzun tanıtım metinleri yerine ürünün kendisi: her özellik, gerçek uygulama ekranıyla."
        />
        <div className="flex flex-col gap-20 md:gap-28 mt-16">
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
