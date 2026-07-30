// NAFAKA — REHBER/TAHMİN. ⚠ Türk hukukunda nafaka için BAĞLAYICI FORMÜL YOKTUR;
// takdir hâkime aittir (TMK m.4, m.175-176). Bu sonuç yalnızca tahmindir.
import type { HesapKalemi, HesapSonucu } from "./types";
import { yuvarla, format } from "./faiz";

export const NAFAKA_UYARISI =
  "Bu bir tahmindir, bağlayıcı değildir, takdir mahkemeye aittir. Nafakanın tür ve miktarı; tarafların ekonomik-sosyal durumu, kusur, çocuk sayısı ve ihtiyaçlara göre hâkim tarafından belirlenir (TMK m.4).";

export interface NafakaGirdi {
  yukumluNetGelir: number; // aylık net
  cocukSayisi: number;
  // Kriter ağırlıkları (rehber): temel oran çocuk başına gelirin ~%15'i (tahmini)
}

// Not: aşağıdaki oranlar YARGISAL BİR KURAL DEĞİL, yalnızca kaba bir rehber göstergedir.
// Kullanıcıya hangi kritere dayandığı açıkça yazılır.
const REHBER_COCUK_ORANI = 0.15;

export function nafakaTahmin(girdi: NafakaGirdi): HesapSonucu {
  const kalemler: HesapKalemi[] = [];
  const cocuk = Math.max(0, girdi.cocukSayisi);

  const tahmin = girdi.yukumluNetGelir * REHBER_COCUK_ORANI * cocuk;
  kalemler.push({
    ad: "İştirak nafakası (tahmini)",
    tutar: yuvarla(tahmin),
    formul: `${format(girdi.yukumluNetGelir)} net gelir × %${(REHBER_COCUK_ORANI * 100).toFixed(0)} × ${cocuk} çocuk`,
    not: "REHBER göstergedir; yargısal bir kural değildir",
  });

  return {
    kalemler,
    toplam: yuvarla(tahmin),
    uyarilar: [NAFAKA_UYARISI],
    tarifeYili: new Date().getFullYear(),
  };
}
