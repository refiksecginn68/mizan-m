"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Tab {
  label: string;
  src: string;
  desc: string;
}

const TABS: Tab[] = [
  {
    label: "Ana Sayfa",
    src: "/images/screens/buro-anasayfa.png",
    desc: "Kota, yaklaşan duruşmalar ve dosyalarınız — güne tek bakışta başlayın.",
  },
  {
    label: "Emsal Arama",
    src: "/images/screens/emsal-arama.png",
    desc: "Milyonlarca içtihat içinde saniyeler içinde doğru emsali bulun.",
  },
  {
    label: "Mevzuat",
    src: "/images/screens/mevzuat-arama.png",
    desc: "Kanun, yönetmelik ve ilgili içtihadı tek aramada tarayın.",
  },
  {
    label: "Dilekçe",
    src: "/images/screens/dilekce.png",
    desc: "Olay özetinden mahkemeye hazır dilekçe taslağına dakikalar içinde.",
  },
];

const HIGHLIGHTS = [
  "Milyonlarca emsal karar, sınırsız arama",
  "Güncel mevzuat kitaplığı",
  "AI destekli dilekçe taslağı",
  "UYAP & UETS entegrasyonu",
];

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden className="flex-shrink-0">
      <path
        d="m2.5 8.5 3.5 3.5 7.5-8"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Ürün Turu: solda kısa tanıtım, sağda gerçek uygulama ekranlarını gösteren
// hafif 3D perspektifli laptop. Sekmeler 5 sn'de bir otomatik döner; manuel
// seçim otomatik geçişi durdurur. Scroll'da perspektif düzleşir.
export default function ProductShowcase({ onAvukatGiris }: { onAvukatGiris: () => void }) {
  const [active, setActive] = useState(0);
  const [flatten, setFlatten] = useState(0);
  const autoRef = useRef(true);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setFlatten(1);
      return;
    }
    const timer = setInterval(() => {
      if (autoRef.current) setActive((a) => (a + 1) % TABS.length);
    }, 5000);
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Bölüm görünüme yaklaştıkça perspektif düzleşir
      const progress = Math.min(1, Math.max(0, 1 - rect.top / (window.innerHeight * 0.7)));
      setFlatten(progress);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const ry = -8 * (1 - flatten);
  const rx = 3 * (1 - flatten);

  return (
    <section ref={sectionRef} className="relative bg-navy-950 py-20 md:py-28 overflow-hidden">
      {/* Altın radial parıltı */}
      <div
        aria-hidden
        className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[1100px] h-[900px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(201,168,76,0.09), transparent 70%)" }}
      />

      <div className="relative z-[1] mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
        {/* Metin */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col gap-5"
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-inter font-semibold uppercase tracking-[0.25em] text-gold-500">
            <span aria-hidden className="h-px w-8 bg-gold-500/60" />
            Ürün Turu
          </span>
          <h2 className="font-heading text-cream font-bold leading-tight [font-size:clamp(2rem,3.5vw,3rem)]">
            Büronuzun tamamı, tek ekranda.
          </h2>
          <p className="font-inter text-cream/60 text-base md:text-lg leading-[1.7]">
            Emsal karar, mevzuat, dilekçe ve dava takibi için gün boyu açtığınız
            sekmeleri tek panelde topladık.
          </p>

          <div className="min-h-[26px] flex items-center gap-2.5">
            <span aria-hidden className="w-5 h-0.5 bg-gold-500 flex-shrink-0" />
            <span aria-live="polite" className="font-heading italic text-[15px] text-cream/85">
              {TABS[active].desc}
            </span>
          </div>

          <ul className="flex flex-col gap-3 mt-1">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2.5 font-inter text-[15px] text-cream/90">
                <CheckIcon />
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <button
              type="button"
              onClick={onAvukatGiris}
              className="inline-block px-6 py-3.5 rounded-lg font-inter text-[15px] font-bold text-navy-950 bg-gold-500 hover:bg-gold-400 transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              Avukat Girişi — Ücretsiz Deneyin
            </button>
          </div>
        </motion.div>

        {/* Laptop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col gap-5 items-center min-w-0"
        >
          <div className="w-full" style={{ perspective: "1700px" }}>
            <div
              className="relative transition-transform duration-300 ease-out"
              style={{ transform: `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`, transformStyle: "preserve-3d" }}
            >
              {/* Altın rim light çerçeve */}
              <div
                className="relative rounded-[18px] p-px"
                style={{
                  background:
                    "linear-gradient(125deg, rgba(201,168,76,0.75) 0%, rgba(201,168,76,0.12) 30%, rgba(255,255,255,0.06) 55%, rgba(0,0,0,0) 75%)",
                  boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 12px 28px rgba(0,0,0,0.4)",
                }}
              >
                {/* Gövde + bezel */}
                <div
                  className="rounded-[17px] p-[3px]"
                  style={{ background: "linear-gradient(160deg, #3c4048 0%, #24272d 45%, #1a1c21 100%)" }}
                >
                  <div className="relative rounded-[14px] bg-[#0b0b0d] px-3 pt-3 pb-3.5">
                    {/* Kamera */}
                    <div
                      aria-hidden
                      className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#1e2833]"
                      style={{ boxShadow: "inset 0 0 1.5px #3f5468" }}
                    />
                    {/* Ekran */}
                    <div className="relative rounded overflow-hidden aspect-video bg-navy-900">
                      {TABS.map((t, i) => (
                        <Image
                          key={t.src}
                          src={t.src}
                          alt={`Mizanım — ${t.label} ekranı`}
                          fill
                          sizes="(min-width: 1024px) 800px, 100vw"
                          priority={i === 0}
                          className="object-cover transition-all duration-500"
                          style={{ opacity: i === active ? 1 : 0, transform: `scale(${i === active ? 1 : 0.98})` }}
                        />
                      ))}
                      {/* Parlama */}
                      <div
                        aria-hidden
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 28%, rgba(255,255,255,0) 45%)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Klavye tabanı */}
              <div
                aria-hidden
                className="relative -mx-4 md:-mx-6 h-[13px] rounded-b-[10px] rounded-t-sm"
                style={{ background: "linear-gradient(180deg, #4a4e57 0%, #2c2f36 55%, #17191d 100%)" }}
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[148px] h-[7px] rounded-b-[9px]"
                  style={{ background: "linear-gradient(180deg, #16181c, #2a2d33)" }}
                />
                <div
                  className="absolute inset-0 rounded-b-[10px] rounded-t-sm pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(201,168,76,0.28), rgba(255,255,255,0.06) 20%, rgba(0,0,0,0) 45%, rgba(255,255,255,0.05) 90%)",
                  }}
                />
              </div>

              {/* Zemin gölgesi */}
              <div
                aria-hidden
                className="absolute left-[6%] right-[6%] bottom-[-34px] h-11 rounded-full -z-10"
                style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.55), transparent 75%)", filter: "blur(18px)" }}
              />
            </div>
          </div>

          {/* Sekmeler */}
          <div role="tablist" aria-label="Ürün ekranları" className="flex flex-wrap justify-center gap-1.5 mt-2">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => {
                  autoRef.current = false;
                  setActive(i);
                }}
                className={`px-4 py-2.5 font-inter text-sm font-semibold tracking-wide border-b-2 transition-colors ${
                  i === active
                    ? "text-cream border-gold-500"
                    : "text-cream/50 border-transparent hover:text-cream/85"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
