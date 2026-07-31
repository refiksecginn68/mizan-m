"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sun, Moon, Bell } from "lucide-react";
import { selamla } from "@/lib/selamlama";

// Ana sayfa imza başlığı — lacivert gradyan + iki katmanlı statik dalga.
// Selamlama kullanıcının yerel saatinden, tema toggle Ayarlar ile TEK kaynak
// (localStorage "mizanim-tema" + <html>.dark) paylaşır; ilk boyama root script'te.
export default function DashboardHeader({
  firstName,
  tarih,
}: {
  firstName: string;
  tarih: string;
}) {
  const [selam, setSelam] = useState<string | null>(null);
  const [koyu, setKoyu] = useState<boolean | null>(null);
  const [okunmamis, setOkunmamis] = useState(0);

  useEffect(() => {
    const guncelle = () => setSelam(selamla(new Date().getHours()));
    guncelle();
    const iv = setInterval(guncelle, 60000);
    setKoyu(document.documentElement.classList.contains("dark"));
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch("/api/buro/bildirimler")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.notifications) {
          setOkunmamis(d.notifications.filter((b: { is_read: boolean }) => !b.is_read).length);
        }
      })
      .catch(() => {});
  }, []);

  function temaDegistir() {
    const yeni = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", yeni);
    localStorage.setItem("mizanim-tema", yeni ? "dark" : "light");
    setKoyu(yeni);
  }

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-navy-700">
      <div className="relative z-10 flex items-start justify-between gap-4 px-4 sm:px-6 pt-6 pb-16">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/15 bg-navy-900">
            <Image src="/logo.png" alt="Mizanım" width={44} height={44} className="w-full h-full object-cover" priority />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white truncate">
              {selam ?? "Hoş geldiniz"}, Av. {firstName}
            </h1>
            <p className="mt-1 text-sm text-white/60 tabular-nums">{tarih}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={temaDegistir}
            aria-label={koyu ? "Açık temaya geç" : "Koyu temaya geç"}
            title={koyu ? "Açık tema" : "Koyu tema"}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white/80 hover:text-gold-500 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 transition-colors"
          >
            {koyu ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <a
            href="#bildirimler"
            aria-label={okunmamis > 0 ? `${okunmamis} okunmamış bildirim` : "Bildirimler"}
            title="Bildirimler"
            className="relative w-11 h-11 rounded-xl flex items-center justify-center text-white/80 hover:text-gold-500 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {okunmamis > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {okunmamis > 9 ? "9+" : okunmamis}
              </span>
            )}
          </a>
        </div>
      </div>

      {/* İki katmanlı statik dalga — arka katman altın ışıması, ön katman sayfa zemini */}
      <div className="absolute inset-x-0 bottom-0 leading-[0] pointer-events-none" aria-hidden="true">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-[9px] w-full h-[42px] fill-gold-500/20"
        >
          <path d="M0,45 C260,102 520,14 780,52 C1020,86 1260,20 1440,50 L1440,120 L0,120 Z" />
        </svg>
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="relative w-full h-[42px] fill-[#f4f5f7] dark:fill-navy-900"
        >
          <path d="M0,52 C240,110 480,12 720,52 C960,92 1200,22 1440,56 L1440,120 L0,120 Z" />
        </svg>
      </div>
    </header>
  );
}
