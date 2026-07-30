// HARÇ & VEKALET — dava/icra harçları + AAÜT vekalet ücreti (maktu/nispi).
import type { HesapKalemi, HesapSonucu } from "./types";
import { GENEL_UYARI } from "./types";
import { tarifeGetir, VARSAYILAN_YIL, type TarifeYili } from "./tarifeler";
import { yuvarla, format } from "./faiz";
import { nispiVekalet } from "./icra-kapak";

// Karar ve ilam harcı nispi oranı (492 s.K.) — resmi metinle teyit edilmeli
const KARAR_ILAM_NISPI = { deger: 0.0683, dogrulanmadi: true };

export interface HarcVekaletGirdi {
  davaDegeri: number;
  vekaletTuru: "nispi" | "maktu";
  yil?: TarifeYili;
}

export function harcVekaletHesapla(girdi: HarcVekaletGirdi): HesapSonucu {
  const yil = girdi.yil ?? VARSAYILAN_YIL;
  const t = tarifeGetir(yil);
  const kalemler: HesapKalemi[] = [];
  const uyarilar: string[] = [GENEL_UYARI];

  // Başvurma harcı (maktu)
  kalemler.push({
    ad: "Başvurma harcı",
    tutar: yuvarla(t.icra.basvurmaHarci.deger),
    formul: `Maktu (${yil})`,
    not: t.icra.basvurmaHarci.dogrulanmadi ? "değer doğrulanmadı" : undefined,
  });

  // Karar ve ilam harcı (nispi) — ¼ peşin
  const nispiHarc = girdi.davaDegeri * KARAR_ILAM_NISPI.deger;
  const pesin = nispiHarc / 4;
  kalemler.push({
    ad: "Karar ve ilam harcı (peşin ¼)",
    tutar: yuvarla(pesin),
    formul: `(${format(girdi.davaDegeri)} × ‰${(KARAR_ILAM_NISPI.deger * 1000).toFixed(2)}) ÷ 4`,
    not: "oran doğrulanmadı — resmi tarifeyle teyit edin",
  });

  // Vekalet ücreti
  const nispi = nispiVekalet(girdi.davaDegeri, t.aaut.nispiDilimler.deger);
  const maktu = t.aaut.icraMaktuGenel.deger;
  const vekalet = girdi.vekaletTuru === "nispi" ? Math.max(nispi, maktu) : maktu;
  kalemler.push({
    ad: "Vekalet ücreti (AAÜT)",
    tutar: yuvarla(vekalet),
    formul: girdi.vekaletTuru === "nispi" ? `Nispi ${format(nispi)} (maktu alt sınır ${format(maktu)})` : `Maktu ${format(maktu)}`,
    not: t.aaut.nispiDilimler.dogrulanmadi ? "nispi dilim oranları doğrulanmadı" : undefined,
  });

  const toplam = kalemler.reduce((s, k) => s + k.tutar, 0);
  return { kalemler, toplam: yuvarla(toplam), uyarilar, tarifeYili: yil };
}
