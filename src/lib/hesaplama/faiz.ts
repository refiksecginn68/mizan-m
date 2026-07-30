// Faiz hesabı — saf, deterministik. Dönem dönem oran değişimini destekler
// (tarih aralığını bölerek). Basit ve bileşik ayrımı net.
import type { HesapSonucu } from "./types";
import { GENEL_UYARI } from "./types";

const GUN_MS = 24 * 60 * 60 * 1000;

// İki tarih arası gün sayısı (bitiş dahil değil — bankacılık/icra günü mantığı)
export function gunFarki(baslangic: string | Date, bitis: string | Date): number {
  const b1 = new Date(baslangic);
  const b2 = new Date(bitis);
  return Math.max(0, Math.round((b2.getTime() - b1.getTime()) / GUN_MS));
}

export interface FaizDonemi {
  baslangic: string; // ISO
  bitis: string; // ISO
  yillikOran: number; // 0.09 = %9
}

export interface FaizGirdi {
  anaPara: number;
  donemler: FaizDonemi[];
  tur: "basit" | "bilesik";
  gunSayaci?: number; // yıl gün tabanı — varsayılan 365
}

// Basit faiz: her dönem ana para üzerinden; bileşik: dönem sonu bakiye taşınır.
export function faizHesapla(girdi: FaizGirdi): HesapSonucu {
  const taban = girdi.gunSayaci ?? 365;
  const kalemler: HesapSonucu["kalemler"] = [];
  let bakiye = girdi.anaPara;
  let toplamFaiz = 0;

  for (const d of girdi.donemler) {
    const gun = gunFarki(d.baslangic, d.bitis);
    const matrah = girdi.tur === "bilesik" ? bakiye : girdi.anaPara;
    const faiz = (matrah * d.yillikOran * gun) / taban;
    toplamFaiz += faiz;
    if (girdi.tur === "bilesik") bakiye += faiz;
    kalemler.push({
      ad: `Dönem faizi (${d.baslangic} → ${d.bitis})`,
      tutar: yuvarla(faiz),
      formul: `${format(matrah)} × %${(d.yillikOran * 100).toFixed(2)} × ${gun}/${taban} gün`,
    });
  }

  return {
    kalemler,
    toplam: yuvarla(toplamFaiz),
    uyarilar: [GENEL_UYARI],
    tarifeYili: new Date(girdi.donemler[0]?.baslangic ?? Date.now()).getFullYear(),
  };
}

export function yuvarla(n: number): number {
  return Math.round(n * 100) / 100;
}
export function format(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
