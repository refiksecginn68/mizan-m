// HARÇ & VEKALET — dava/icra harçları + AAÜT vekalet ücreti (maktu/nispi).
import type { HesapKalemi, HesapSonucu } from "./types";
import { GENEL_UYARI } from "./types";
import { tarifeGetir, VARSAYILAN_YIL, type TarifeYili } from "./tarifeler";
import { yuvarla, format } from "./faiz";
import { nispiVekalet } from "./icra-kapak";

// Karar ve ilam harcı nispi oranı — 492 s.K. (1) sayılı tarife A/III-1-a: binde 68,31
const KARAR_ILAM_NISPI = { deger: 0.0683100, dogrulanmadi: false };

export interface HarcVekaletGirdi {
  davaDegeri: number;
  vekaletTuru: "nispi" | "maktu";
  dosyaTuru?: "dava" | "degisik-is";
  // Bilgi amaçlı: harç matrahına etkisi MEVZUATTAN doğrulanamadı, hesaba KATILMAZ (bkz. uyarılar)
  faizDegeri?: number;
  mahsupDegeri?: number;
  tarafSayisi?: number;
  tanikSayisi?: number;
  bilirkisiSayisi?: number;
  vekilSayisi?: number;
  kesifVar?: boolean;
  tedbirVar?: boolean;
  yil?: TarifeYili;
}

export function harcVekaletHesapla(girdi: HarcVekaletGirdi): HesapSonucu {
  const yil = girdi.yil ?? VARSAYILAN_YIL;
  const t = tarifeGetir(yil);
  const kalemler: HesapKalemi[] = [];
  const uyarilar: string[] = [GENEL_UYARI];

  if (girdi.dosyaTuru === "degisik-is") {
    uyarilar.push("Dosya Türü \"Değişik İş\" seçildi — bu hesaplayıcı dava/değişik iş harç rejimi ayrımı YAPMIYOR (resmi kaynaktan doğrulanamadı); aşağıdaki kalemler dava harcı mantığıyla hesaplandı.");
  }
  if (girdi.faizDegeri || girdi.mahsupDegeri) {
    uyarilar.push("Faiz/Mahsup değerinin harç matrahına etkisi mevzuattan doğrulanamadı — bu tutarlar hesaba KATILMADI, sadece bilgi amaçlı gösteriliyor.");
  }
  if (girdi.tanikSayisi || girdi.bilirkisiSayisi || girdi.kesifVar || girdi.tedbirVar) {
    uyarilar.push("Tanık/bilirkişi/keşif/tedbir gider avansı TUTARLARI resmi 2026 tarifesinden doğrulanamadı (Adalet Bakanlığı gider avansı tarifesi güncellemesi bulunamadı) — bu kalemler 0 TL ile listelenir, ilgili birimden teyit edin.");
  }

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
    not: KARAR_ILAM_NISPI.dogrulanmadi ? "oran doğrulanmadı — resmi tarifeyle teyit edin" : undefined,
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

  // Bilgi amaçlı kalemler — matraha KATILMAZ (doğrulanamadı, bkz. yukarıdaki uyarılar)
  if (girdi.faizDegeri) {
    kalemler.push({ ad: "Faiz değeri (bilgi amaçlı)", tutar: 0, formul: `${format(girdi.faizDegeri)} — matraha eklenmedi`, not: "doğrulanamadı" });
  }
  if (girdi.mahsupDegeri) {
    kalemler.push({ ad: "Mahsup değeri (bilgi amaçlı)", tutar: 0, formul: `${format(girdi.mahsupDegeri)} — matrahtan düşülmedi`, not: "doğrulanamadı" });
  }
  if (girdi.tanikSayisi) {
    kalemler.push({ ad: "Tanık gideri avansı", tutar: 0, formul: `${girdi.tanikSayisi} tanık`, not: "tutar doğrulanamadı" });
  }
  if (girdi.bilirkisiSayisi) {
    kalemler.push({ ad: "Bilirkişi gideri avansı", tutar: 0, formul: `${girdi.bilirkisiSayisi} bilirkişi`, not: "tutar doğrulanamadı" });
  }
  if (girdi.kesifVar) {
    kalemler.push({ ad: "Keşif gideri avansı", tutar: 0, formul: "Keşif talep edildi", not: "tutar doğrulanamadı" });
  }
  if (girdi.tedbirVar) {
    kalemler.push({ ad: "Tedbir gideri/harcı", tutar: 0, formul: "Tedbir talep edildi", not: "tutar doğrulanamadı" });
  }
  if (girdi.vekilSayisi && girdi.vekilSayisi > 1) {
    kalemler.push({ ad: "Ek vekil (bilgi amaçlı)", tutar: 0, formul: `${girdi.vekilSayisi} vekil`, not: "birden fazla vekilin harca etkisi doğrulanamadı" });
  }

  const toplam = kalemler.reduce((s, k) => s + k.tutar, 0);
  return { kalemler, toplam: yuvarla(toplam), uyarilar, tarifeYili: yil };
}
