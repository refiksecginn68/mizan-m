"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  /** Sayaç hedef değeri (yalnız sayısal kısım) */
  value: number;
  /** Sayının önüne gelen ek ("<" gibi) */
  prefix?: string;
  /** Sayının arkasına gelen ek ("M+", "sn" gibi) */
  suffix?: string;
  label: string;
}

// TODO: gerçek metrik — bu rakamlar geçicidir, gerçek veriler gelince güncellenecek
const STATS: Stat[] = [
  { value: 2.5, suffix: "M+", label: "Emsal Karar" },
  { value: 3, prefix: "< ", suffix: " sn", label: "Ortalama Yanıt" },
  { value: 24, prefix: "7/", label: "Erişim" },
  { value: 100, prefix: "%", label: "KVKK Uyumlu" },
];

// Görünüme girince 0'dan hedefe sayan sayaç
function CountUp({ stat, active }: { stat: Stat; active: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setDisplay(stat.value);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    let rafId = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(stat.value * eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, stat.value]);

  const formatted = Number.isInteger(stat.value)
    ? Math.round(display).toString()
    : display.toFixed(1).replace(".", ",");

  return (
    <span className="font-heading font-bold text-gold-400 [font-size:clamp(2.25rem,4vw,3.5rem)] tabular-nums">
      {stat.prefix ?? ""}{formatted}{stat.suffix ?? ""}
    </span>
  );
}

// İstatistik bandı: koyu tam genişlik, scroll'a girince count-up animasyonu
export default function StatsBand() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section aria-label="Platform istatistikleri" className="bg-navy-950 border-y border-navy-800">
      <motion.div
        ref={ref}
        className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20 grid grid-cols-2 lg:grid-cols-4 gap-y-12"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center gap-2 px-4 ${
              i > 0 ? "lg:border-l lg:border-gold-500/15" : ""
            }`}
          >
            <CountUp stat={stat} active={inView} />
            <span className="font-inter text-xs md:text-sm uppercase tracking-[0.2em] text-cream/50">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
