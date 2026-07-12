"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Gavel } from "lucide-react";
import SectionHeading from "@/components/landing/section-heading";

// 3D sahne yalnızca istemcide yüklenir (three.js SSR'a girmez)
const Hammer3D = dynamic(() => import("@/components/landing/hammer-3d"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

// Yüklenirken / 3D kapalıyken gösterilen statik temsil
function SceneFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center" aria-hidden>
      <div className="relative w-40 h-40 rounded-full border border-gold-500/30 flex items-center justify-center">
        <div className="absolute inset-3 rounded-full border border-dashed border-gold-500/20" />
        <Gavel className="w-16 h-16 text-gold-500" />
      </div>
    </div>
  );
}

// 3D çekiç bölümü: masaüstünde etkileşimli R3F sahne, mobilde statik görsel.
// prefers-reduced-motion tercihinde animasyon devre dışı kalır.
export default function HammerScene() {
  const [enable3d, setEnable3d] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    setEnable3d(!reducedMotion && isDesktop);
  }, []);

  return (
    <section className="bg-navy-900 py-20 md:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Metin tarafı */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="order-2 lg:order-1"
        >
          <SectionHeading
            eyebrow="Denge"
            title="Her karar bir denge meselesidir."
            align="left"
          />
          <p className="font-inter text-cream/60 text-base md:text-lg leading-[1.7] mt-6 max-w-xl">
            Hukukta hız, özenin alternatifi değildir. Mizanım; milyonlarca emsal kararı,
            güncel mevzuatı ve dosyanızın bağlamını aynı terazide tartar — siz karara
            odaklanın, araştırmayı ve taslağı biz hazırlayalım.
          </p>
          <p className="font-inter text-sm text-cream/40 mt-4 border-l-2 border-gold-500/60 pl-3">
            İpucu: Fareyi sahnenin üzerinde gezdirin, tokmak karar versin.
          </p>
        </motion.div>

        {/* 3D sahne / statik görsel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="order-1 lg:order-2 relative h-[320px] md:h-[420px] rounded-2xl bg-navy-950 border border-navy-800 overflow-hidden"
        >
          {/* Köşe altın çizgiler */}
          <div aria-hidden className="absolute top-4 left-4 w-10 h-10 border-l border-t border-gold-500/40 z-10" />
          <div aria-hidden className="absolute bottom-4 right-4 w-10 h-10 border-r border-b border-gold-500/40 z-10" />

          {enable3d ? <Hammer3D /> : <SceneFallback />}
        </motion.div>
      </div>
    </section>
  );
}
