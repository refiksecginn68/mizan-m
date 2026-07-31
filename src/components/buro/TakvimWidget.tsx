"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Plus, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export interface TakvimEtkinlik {
  id: string;
  title: string;
  type: string;
  dateISO: string;
  location?: string | null;
}
export interface SureUyari {
  id: string;
  label: string;
  dateISO: string;
  gecikti: boolean;
}

const TUR_ETIKET: Record<string, string> = {
  durusma: "Duruşma", toplanti: "Toplantı", sure: "Süre",
  tebligat: "Tebligat", odeme: "Ödeme", not: "Not", diger: "Diğer",
};
const TUR_RENK: Record<string, string> = {
  durusma: "bg-red-100 text-red-700", toplanti: "bg-blue-100 text-blue-700",
  sure: "bg-orange-100 text-orange-700", tebligat: "bg-purple-100 text-purple-700",
  odeme: "bg-green-100 text-green-700", not: "bg-yellow-100 text-yellow-700",
  diger: "bg-gray-100 text-gray-600",
};
const GUN_BASLIK = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

// Yerel gün anahtarı (YYYY-MM-DD) — saat dilimi kaymasız gün eşleştirme.
function gunAnahtar(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function kalanGun(iso: string): number {
  const now = new Date();
  const bugun = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(iso);
  const hedef = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((hedef.getTime() - bugun.getTime()) / 86400000);
}
function geriSayimEtiket(gun: number): string {
  if (gun < 0) return `${Math.abs(gun)} gün geçti`;
  if (gun === 0) return "Bugün";
  if (gun === 1) return "Yarın";
  return `${gun} gün`;
}
function acilMi(gun: number): boolean {
  return gun <= 3;
}

function GeriSayimRozet({ gun }: { gun: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
        acilMi(gun) ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {acilMi(gun) && <AlertTriangle className="w-2.5 h-2.5" />}
      {geriSayimEtiket(gun)}
    </span>
  );
}

export default function TakvimWidget({
  etkinlikler,
  uyarilar,
}: {
  etkinlikler: TakvimEtkinlik[];
  uyarilar: SureUyari[];
}) {
  const bugun = new Date();
  const [gorunenAy, setGorunenAy] = useState({ yil: bugun.getFullYear(), ay: bugun.getMonth() });
  const [secili, setSecili] = useState(gunAnahtar(bugun));

  // Gün → işaret haritası: kırmızı (duruşma/gecikmiş) öncelikli, yoksa altın.
  const isaretler = useMemo(() => {
    const m = new Map<string, "kirmizi" | "altin">();
    for (const e of etkinlikler) {
      const k = gunAnahtar(new Date(e.dateISO));
      if (e.type === "durusma") m.set(k, "kirmizi");
      else if (!m.has(k)) m.set(k, "altin");
    }
    for (const u of uyarilar) {
      const k = gunAnahtar(new Date(u.dateISO));
      if (u.gecikti) m.set(k, "kirmizi");
      else if (!m.has(k)) m.set(k, "altin");
    }
    return m;
  }, [etkinlikler, uyarilar]);

  // Seçili günün kayıtları (etkinlik + uyarı) saat sırasıyla.
  const seciliKayitlar = useMemo(() => {
    const ev = etkinlikler
      .filter((e) => gunAnahtar(new Date(e.dateISO)) === secili)
      .map((e) => ({ kind: "ev" as const, ...e }));
    const uy = uyarilar
      .filter((u) => gunAnahtar(new Date(u.dateISO)) === secili)
      .map((u) => ({ kind: "uy" as const, ...u }));
    return [...ev, ...uy].sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
  }, [etkinlikler, uyarilar, secili]);

  // En yakın kritik: ≤3 gün kalan ilk etkinlik.
  const kritik = etkinlikler.find((e) => {
    const g = kalanGun(e.dateISO);
    return g >= 0 && g <= 3;
  });

  // Ay ızgarası — pazartesi başlangıçlı 6 satır.
  const ilkGun = new Date(gorunenAy.yil, gorunenAy.ay, 1);
  const oncekiBosluk = (ilkGun.getDay() + 6) % 7; // Pazartesi=0
  const gunSayisi = new Date(gorunenAy.yil, gorunenAy.ay + 1, 0).getDate();
  const hucreler: (Date | null)[] = [];
  for (let i = 0; i < oncekiBosluk; i++) hucreler.push(null);
  for (let g = 1; g <= gunSayisi; g++) hucreler.push(new Date(gorunenAy.yil, gorunenAy.ay, g));
  while (hucreler.length % 7 !== 0) hucreler.push(null);

  const bugunKey = gunAnahtar(bugun);

  function ayDegistir(delta: number) {
    setGorunenAy((s) => {
      const d = new Date(s.yil, s.ay + delta, 1);
      return { yil: d.getFullYear(), ay: d.getMonth() };
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Başlık + ay gezinme */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#c9a84c]" />
          <h2 className="font-heading text-sm font-bold text-[#0f1729] leading-tight">Takvim</h2>
        </div>
        <Link
          href="/buro/takvim"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c9a84c] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Etkinlik Ekle
        </Link>
      </div>

      {kritik && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-red-800">Yaklaşan kritik tarih</p>
                <GeriSayimRozet gun={kalanGun(kritik.dateISO)} />
              </div>
              <p className="text-xs text-red-700 truncate mt-0.5">{kritik.title}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-3">
        {/* Ay başlığı + oklar */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => ayDegistir(-1)}
            aria-label="Önceki ay"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0f1729] hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c9a84c] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="font-heading text-sm font-bold text-[#0f1729]">
            {AYLAR[gorunenAy.ay]} {gorunenAy.yil}
          </p>
          <button
            type="button"
            onClick={() => ayDegistir(1)}
            aria-label="Sonraki ay"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0f1729] hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c9a84c] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hafta başlıkları */}
        <div className="grid grid-cols-7 mb-1">
          {GUN_BASLIK.map((g) => (
            <span key={g} className="text-center text-[10px] font-semibold text-gray-400">{g}</span>
          ))}
        </div>

        {/* Gün ızgarası */}
        <div className="grid grid-cols-7 gap-0.5">
          {hucreler.map((d, i) => {
            if (!d) return <span key={`b-${i}`} />;
            const k = gunAnahtar(d);
            const isaret = isaretler.get(k);
            const seciliMi = k === secili;
            const bugunMu = k === bugunKey;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSecili(k)}
                aria-label={`${d.getDate()} ${AYLAR[d.getMonth()]}${isaret ? ", kayıt var" : ""}`}
                aria-pressed={seciliMi}
                className={`relative h-8 rounded-lg flex flex-col items-center justify-center text-xs tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c9a84c] ${
                  seciliMi
                    ? "bg-[#0f1729] text-white font-bold"
                    : bugunMu
                    ? "text-[#c9a84c] font-bold hover:bg-gray-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {d.getDate()}
                {isaret && (
                  <span
                    className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                      seciliMi ? "bg-white" : isaret === "kirmizi" ? "bg-red-500" : "bg-[#c9a84c]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Seçili günün kayıtları */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {(() => {
              const [, m, g] = secili.split("-").map(Number);
              return `${g} ${AYLAR[m - 1]}`;
            })()}
          </p>
          {seciliKayitlar.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Bu gün için kayıt yok.</p>
          ) : (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {seciliKayitlar.map((k) =>
                k.kind === "ev" ? (
                  <div key={`ev-${k.id}`} className="flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${TUR_RENK[k.type] ?? TUR_RENK.diger}`}>
                      {TUR_ETIKET[k.type] ?? "Diğer"}
                    </span>
                    <p className="text-xs font-medium text-[#0f1729] truncate flex-1">{k.title}</p>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0 tabular-nums">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(k.dateISO).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ) : (
                  <div key={`uy-${k.id}`} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${k.gecikti ? "bg-red-50" : "bg-gray-50"}`}>
                    <p className={`text-xs truncate flex-1 ${k.gecikti ? "text-red-700 font-medium" : "text-gray-700"}`}>{k.label}</p>
                    <GeriSayimRozet gun={kalanGun(k.dateISO)} />
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <Link
        href="/buro/takvim"
        className="flex items-center justify-center gap-1 px-5 py-2.5 border-t border-gray-100 text-xs font-semibold text-[#c9a84c] hover:bg-gray-50 transition-colors"
      >
        Takvimi Aç <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
