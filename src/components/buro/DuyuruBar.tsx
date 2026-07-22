"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";

export interface Duyuru {
  id: string;
  kategori?: string;
  text: string;
  href: string;
}

// Üstte ince, kompakt duyuru barı — 5 sn'de bir yumuşak geçişle döner,
// hover'da duraklar, tıklayınca detaya gider. Yalnızca opacity/transform anime edilir.
export default function DuyuruBar({ items }: { items: Duyuru[] }) {
  const [idx, setIdx] = useState(0);
  const [gorunur, setGorunur] = useState(true);
  const durakladi = useRef(false);

  useEffect(() => {
    if (items.length < 2) return;
    const iv = setInterval(() => {
      if (durakladi.current) return;
      setGorunur(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % items.length);
        setGorunur(true);
      }, 220);
    }, 5000);
    return () => clearInterval(iv);
  }, [items.length]);

  if (items.length === 0) return null;
  const aktif = items[idx];

  return (
    <div
      onMouseEnter={() => { durakladi.current = true; }}
      onMouseLeave={() => { durakladi.current = false; }}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2 overflow-hidden"
    >
      <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#c9a84c] uppercase tracking-wide flex-shrink-0">
        <Megaphone className="w-3.5 h-3.5" />
        Duyuru
      </span>
      <div className="flex-1 min-w-0">
        <Link
          href={aktif.href}
          className={`block text-xs text-gray-700 hover:text-[#0f1729] truncate transition-all duration-200 ease-out ${
            gorunur ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1.5"
          }`}
        >
          {aktif.kategori && (
            <span className="font-semibold text-[#1a2744]">{aktif.kategori}: </span>
          )}
          {aktif.text}
        </Link>
      </div>
      {items.length > 1 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {items.map((d, i) => (
            <button
              key={d.id}
              onClick={() => { setIdx(i); setGorunur(true); }}
              aria-label={`Duyuru ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                i === idx ? "bg-[#c9a84c]" : "bg-gray-200 hover:bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
