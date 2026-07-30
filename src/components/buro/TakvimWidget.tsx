"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin, Plus, AlertTriangle, ChevronRight } from "lucide-react";

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

// Gün farkı (bugün 00:00 esaslı). Negatif = geçmiş.
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
// ≤3 gün (veya geçmiş) → kırmızı vurgulu
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
  const bugunTarih = new Date().toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const bugunEtkinlik = etkinlikler.filter((e) => kalanGun(e.dateISO) === 0);
  const durusmalar = etkinlikler
    .filter((e) => e.type === "durusma" && kalanGun(e.dateISO) >= 0)
    .slice(0, 4);
  // En yakın kritik: ≤3 gün kalan ilk etkinlik
  const kritik = etkinlikler.find((e) => {
    const g = kalanGun(e.dateISO);
    return g >= 0 && g <= 3;
  });

  const bosMu = etkinlikler.length === 0 && uyarilar.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Başlık */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#c9a84c]" />
          <div>
            <h2 className="font-heading text-sm font-bold text-[#0f1729] leading-tight">Takvim</h2>
            <p className="text-[10px] text-gray-400">{bugunTarih}</p>
          </div>
        </div>
        <Link
          href="/buro/takvim"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c9a84c] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Etkinlik Ekle
        </Link>
      </div>

      {/* Kritik uyarı — en yakın ≤3 gün */}
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

      <div className="p-4 space-y-4">
        {bosMu && (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Yaklaşan etkinlik yok</p>
            <Link href="/buro/takvim" className="text-xs text-[#c9a84c] hover:underline mt-1 inline-block">
              Etkinlik ekle →
            </Link>
          </div>
        )}

        {/* Bugün */}
        {bugunEtkinlik.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Bugün</p>
            <div className="space-y-1.5">
              {bugunEtkinlik.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${TUR_RENK[e.type] ?? TUR_RENK.diger}`}>
                    {TUR_ETIKET[e.type] ?? "Diğer"}
                  </span>
                  <p className="text-xs font-medium text-[#0f1729] truncate flex-1">{e.title}</p>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(e.dateISO).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yaklaşan Duruşmalar */}
        {durusmalar.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Yaklaşan Duruşmalar</p>
            <div className="space-y-1.5">
              {durusmalar.map((e) => {
                const gun = kalanGun(e.dateISO);
                const d = new Date(e.dateISO);
                return (
                  <div key={e.id} className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 text-center bg-[#0f1729] rounded-lg w-9 py-1">
                      <p className="text-[9px] font-bold text-[#c9a84c] leading-none">
                        {d.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase()}
                      </p>
                      <p className="text-sm font-bold text-white leading-none mt-0.5">{d.getDate()}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#0f1729] truncate">{e.title}</p>
                        <GeriSayimRozet gun={gun} />
                      </div>
                      {e.location && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5 truncate">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{e.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Süre / Görev Uyarıları */}
        {uyarilar.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Süre / Görev Uyarıları</p>
            <div className="space-y-1.5">
              {uyarilar.map((u) => {
                const gun = kalanGun(u.dateISO);
                return (
                  <div key={u.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${u.gecikti ? "bg-red-50" : "bg-gray-50"}`}>
                    <p className={`text-xs truncate flex-1 ${u.gecikti ? "text-red-700 font-medium" : "text-gray-700"}`}>{u.label}</p>
                    <GeriSayimRozet gun={gun} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!bosMu && (
        <Link
          href="/buro/takvim"
          className="flex items-center justify-center gap-1 px-5 py-3 border-t border-gray-100 text-xs font-semibold text-[#c9a84c] hover:bg-gray-50 transition-colors"
        >
          Takvimi Aç <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
