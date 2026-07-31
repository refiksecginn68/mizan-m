"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// AI sorgu kotası — ince ilerleme çubuğu + açılışta 0'dan gerçek değere sayım.
// Eşik renkleri yalnızca burada: %20 altı kehribar, %5 altı kırmızı.
export default function KotaBar({ remaining, total }: { remaining: number; total: number }) {
  const [gosterilen, setGosterilen] = useState(0);
  const oran = total > 0 ? remaining / total : 0;

  useEffect(() => {
    const azalt = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (azalt || remaining <= 0) {
      setGosterilen(remaining);
      return;
    }
    const sure = 600;
    const bas = performance.now();
    let raf = 0;
    const adim = (t: number) => {
      const p = Math.min(1, (t - bas) / sure);
      setGosterilen(Math.round(remaining * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(adim);
      else setGosterilen(remaining);
    };
    raf = requestAnimationFrame(adim);
    // rAF sekme gizliyken durur; nihai değeri garantiye al.
    const emniyet = setTimeout(() => setGosterilen(remaining), sure + 80);
    return () => { cancelAnimationFrame(raf); clearTimeout(emniyet); };
  }, [remaining]);

  const cubukRenk = oran < 0.05 ? "bg-red-500" : oran < 0.2 ? "bg-amber-500" : "bg-[#c9a84c]";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">Yapay Zeka Sorgu Kotası</p>
          <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">
            Kalan Sorgu: <span className="text-[#c9a84c]">{gosterilen}</span> / {total}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Mevzuat ve karar aramaları kotanızdan düşmez. MizanAI sohbeti ve AI analizleri dahildir.
          </p>
        </div>
        <Link
          href="/kredi"
          className="px-4 py-2 bg-[#1a2744] hover:bg-[#0f1729] text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0"
        >
          Ek Paket Satın Al
        </Link>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={remaining} aria-valuemin={0} aria-valuemax={total}>
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${cubukRenk}`}
          style={{ width: `${Math.max(2, Math.round(oran * 100))}%` }}
        />
      </div>
    </div>
  );
}
