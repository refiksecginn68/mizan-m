"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, Check } from "lucide-react";
import {
  FAVORI_KATALOG,
  FAVORI_SAYISI,
  favorileriCoz,
} from "@/lib/buro-favoriler";

// Ana sayfa favori kısayolları — 2×2 kart + "Favorileri Düzenle" modalı.
// Katalog tek kaynak (@/lib/buro-favoriler). Tam 4 favori zorunlu.
export default function FavorilerBlok({ initial }: { initial: string[] }) {
  const [favoriler, setFavoriler] = useState<string[]>(() =>
    favorileriCoz(initial).map((k) => k.key)
  );
  const [modalAcik, setModalAcik] = useState(false);
  const [secim, setSecim] = useState<string[]>(favoriler);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const tetikleyiciRef = useRef<HTMLButtonElement>(null);

  const kartlar = favorileriCoz(favoriler);

  function acModal() {
    setSecim(favoriler);
    setHata("");
    setModalAcik(true);
  }

  // ESC + odak yönetimi + body scroll kilidi
  useEffect(() => {
    if (!modalAcik) return;
    const tetikleyici = tetikleyiciRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); setModalAcik(false); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      tetikleyici?.focus();
    };
  }, [modalAcik]);

  function toggle(key: string) {
    setSecim((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= FAVORI_SAYISI) return prev; // 4'ten fazla seçilemez
      return [...prev, key];
    });
  }

  async function kaydet() {
    if (secim.length !== FAVORI_SAYISI) return;
    setKaydediliyor(true);
    setHata("");
    const onceki = favoriler;
    setFavoriler(secim); // optimistic
    setModalAcik(false);
    try {
      const res = await fetch("/api/buro/favoriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: secim }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setFavoriler(onceki); // geri al
        setHata(j.error ?? "Kaydedilemedi");
        setModalAcik(true);
      }
    } catch {
      setFavoriler(onceki);
      setHata("Bağlantı hatası");
      setModalAcik(true);
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <section aria-label="Favori kısayollar">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-base font-bold text-[#0f1729]">Hızlı Erişim</h2>
        <button
          ref={tetikleyiciRef}
          type="button"
          onClick={acModal}
          aria-label="Kısayolları düzenle"
          title="Kısayolları düzenle"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-[#c9a84c] hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c9a84c] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Kartlar — mobilde 2×2, masaüstünde tek sıra */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kartlar.map(({ key, label, sublabel, icon: Icon, route }) => (
          <Link
            key={key}
            href={route}
            className="group flex flex-col items-center gap-2.5 bg-white border border-gray-200 rounded-2xl px-4 py-6 shadow-sm hover:border-[#c9a84c]/60 hover:shadow-lg hover:-translate-y-0.5 hover:ring-1 hover:ring-[#c9a84c]/30 active:translate-y-0 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0f1729] flex items-center justify-center group-hover:bg-[#c9a84c] group-hover:scale-105 transition-all duration-200">
              <Icon className="w-6 h-6 text-[#c9a84c] group-hover:text-white transition-colors duration-200" />
            </div>
            <div className="text-center">
              <p className="font-heading text-sm font-bold text-[#0f1729] leading-tight">{label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Favorileri Düzenle modalı */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={() => setModalAcik(false)} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Favorileri düzenle"
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-heading text-base font-bold text-[#0f1729]">Favorileri Düzenle</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tam {FAVORI_SAYISI} kısayol seçin</p>
              </div>
              <button
                type="button"
                onClick={() => setModalAcik(false)}
                aria-label="Kapat"
                className="text-gray-400 hover:text-[#0f1729] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FAVORI_KATALOG.map(({ key, label, sublabel, icon: Icon }) => {
                const secili = secim.includes(key);
                const doluDegil = secim.length < FAVORI_SAYISI;
                const tiklanabilir = secili || doluDegil;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    aria-pressed={secili}
                    disabled={!tiklanabilir}
                    className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                      secili
                        ? "border-[#c9a84c] bg-[#c9a84c]/10"
                        : tiklanabilir
                        ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        : "border-gray-100 opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${secili ? "bg-[#0f1729]" : "bg-gray-100"}`}>
                      <Icon className={`w-4 h-4 ${secili ? "text-[#c9a84c]" : "text-gray-500"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0f1729] truncate">{label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{sublabel}</p>
                    </div>
                    {secili && <Check className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100 flex-shrink-0">
              <span className={`text-xs font-medium ${secim.length === FAVORI_SAYISI ? "text-green-600" : "text-gray-400"}`}>
                {secim.length}/{FAVORI_SAYISI} seçildi
              </span>
              <div className="flex items-center gap-2">
                {hata && <span className="text-xs text-red-600">{hata}</span>}
                <button
                  type="button"
                  onClick={kaydet}
                  disabled={secim.length !== FAVORI_SAYISI || kaydediliyor}
                  className="bg-[#0f1729] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#1a2744] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
