"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface HeroVideoProps {
  /** Avukat girişi butonuna basılınca KVKK modalını açar */
  onAvukatGiris: () => void;
}

// Framer Motion kademeli giriş varyantları: logo → başlık → alt metin → butonlar
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

// Tam ekran hero: video arka plan + koyu overlay + köşe altın çerçeveler.
// Mobil ve prefers-reduced-motion durumunda video yerine poster görsel kullanılır.
export default function HeroVideo({ onAvukatGiris }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    setShowVideo(!reducedMotion && isDesktop);
  }, []);

  return (
    <section className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden bg-navy-950">
      {/* Arka plan: video (masaüstü) veya poster (mobil / azaltılmış hareket) */}
      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-poster.jpg"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/videos/hero.webm" type="video/webm" />
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image
          src="/images/hero-poster.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      {/* Koyu overlay + üstten alta koyulaşan gradyan */}
      <div aria-hidden className="absolute inset-0 bg-navy-950/[0.78]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-navy-950/30 via-transparent to-navy-950" />

      {/* Köşe altın çerçeveler (Diacara esintisi) */}
      <div aria-hidden className="absolute top-24 left-6 md:left-12 w-16 h-16 border-l border-t border-gold-500/50" />
      <div aria-hidden className="absolute top-24 right-6 md:right-12 w-16 h-16 border-r border-t border-gold-500/50" />
      <div aria-hidden className="absolute bottom-16 left-6 md:left-12 w-16 h-16 border-l border-b border-gold-500/50" />
      <div aria-hidden className="absolute bottom-16 right-6 md:right-12 w-16 h-16 border-r border-b border-gold-500/50" />

      {/* İçerik */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-5 max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.span
          variants={itemVariants}
          className="relative w-20 h-20 rounded-2xl overflow-hidden bg-navy-900 ring-1 ring-gold-500/30 shadow-2xl mb-8"
        >
          <Image src="/images/logo.png" alt="Mizanım logosu" fill priority sizes="80px" className="object-cover" />
        </motion.span>

        <motion.h1
          variants={itemVariants}
          className="font-heading font-bold text-cream leading-[1.1] [font-size:clamp(2.5rem,5vw,4.5rem)]"
        >
          Adaletin dijital{" "}
          <span className="text-gold-400">terazisi</span>.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="font-inter text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl mt-6"
        >
          Türkiye&apos;nin ilk çift portallı yapay zekâ hukuk platformu. Emsal, mevzuat,
          dilekçe, UYAP ve UETS — hepsi tek ekranda.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <button
            type="button"
            onClick={onAvukatGiris}
            className="px-8 py-4 rounded-md font-inter text-sm md:text-base font-semibold text-navy-950 bg-gold-500 hover:bg-gold-400 transition-all hover:-translate-y-1 shadow-lg shadow-gold-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
          >
            Avukat Girişi — 14 Gün Ücretsiz
          </button>
          <Link
            href="/giris?role=vatandas"
            className="px-8 py-4 rounded-md font-inter text-sm md:text-base text-cream border border-cream/25 hover:border-gold-500/60 hover:text-gold-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
          >
            Vatandaş Girişi
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll göstergesi — nabız animasyonu */}
      <motion.div
        aria-hidden
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gold-500/70"
        animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}
