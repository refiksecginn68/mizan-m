// İŞÇİLİK ALACAKLARI — saf, deterministik.
// Kıdem (tavan uygulanır), ihbar (kademeli), yıllık izin, fazla mesai.
import type { HesapKalemi, HesapSonucu } from "./types";
import { GENEL_UYARI } from "./types";
import { tarifeGetir, VARSAYILAN_YIL, type TarifeYili } from "./tarifeler";
import { gunFarki, yuvarla, format } from "./faiz";

export interface IscilikGirdi {
  iseGiris: string; // ISO
  istenCikis: string; // ISO
  aylikBrutUcret: number; // giydirilmiş brüt
  kullanilmayanIzinGunu?: number;
  fazlaMesaiSaati?: number;
  ihbarKullanildi?: boolean; // ihbar öneli kullanıldıysa ihbar tazminatı yok
  yil?: TarifeYili;
}

// İhbar öneli (İş K. m.17) — hizmet süresine göre hafta
function ihbarHaftasi(gun: number): number {
  const yil = gun / 365;
  if (yil < 0.5) return 2;
  if (yil < 1.5) return 4;
  if (yil < 3) return 6;
  return 8;
}

export function iscilikHesapla(girdi: IscilikGirdi): HesapSonucu {
  const yil = girdi.yil ?? VARSAYILAN_YIL;
  const t = tarifeGetir(yil);
  const kalemler: HesapKalemi[] = [];
  const uyarilar: string[] = [GENEL_UYARI];

  const gun = gunFarki(girdi.iseGiris, girdi.istenCikis);
  const hizmetYili = gun / 365;
  const gunlukUcret = girdi.aylikBrutUcret / 30;

  // Kıdem tavanı — çıkış tarihinin dönemine göre (Oca-Haz / Tem-Ara)
  const cikisAy = new Date(girdi.istenCikis).getMonth() + 1;
  const tavanObj = cikisAy <= 6 ? t.iscilik.kidemTavani.h1 : t.iscilik.kidemTavani.h2;
  const kidemMatrah = Math.min(girdi.aylikBrutUcret, tavanObj.deger);

  // Kıdem tazminatı: her tam yıl 1 aylık; artan süre orantılı
  const kidem = kidemMatrah * hizmetYili;
  kalemler.push({
    ad: "Kıdem tazminatı",
    tutar: yuvarla(kidem),
    formul: `${format(kidemMatrah)} × ${hizmetYili.toFixed(4)} yıl` +
      (girdi.aylikBrutUcret > tavanObj.deger ? ` (tavan ${format(tavanObj.deger)} uygulandı)` : ""),
  });

  // İhbar tazminatı (işveren fesihte, ihbar öneli kullanılmadıysa)
  if (!girdi.ihbarKullanildi) {
    const hafta = ihbarHaftasi(gun);
    const ihbar = gunlukUcret * 7 * hafta;
    kalemler.push({
      ad: "İhbar tazminatı",
      tutar: yuvarla(ihbar),
      formul: `${format(gunlukUcret)}/gün × 7 × ${hafta} hafta (hizmet ${hizmetYili.toFixed(2)} yıl)`,
    });
  }

  // Yıllık izin ücreti
  if (girdi.kullanilmayanIzinGunu && girdi.kullanilmayanIzinGunu > 0) {
    const izin = gunlukUcret * girdi.kullanilmayanIzinGunu;
    kalemler.push({
      ad: "Yıllık izin ücreti",
      tutar: yuvarla(izin),
      formul: `${format(gunlukUcret)}/gün × ${girdi.kullanilmayanIzinGunu} gün`,
    });
  }

  // Fazla mesai (%50 zamlı)
  if (girdi.fazlaMesaiSaati && girdi.fazlaMesaiSaati > 0) {
    const saatlik = girdi.aylikBrutUcret / 225; // ~aylık 225 saat esası
    const fm = saatlik * 1.5 * girdi.fazlaMesaiSaati;
    kalemler.push({
      ad: "Fazla mesai",
      tutar: yuvarla(fm),
      formul: `${format(saatlik)}/saat × 1,5 × ${girdi.fazlaMesaiSaati} saat`,
      not: "aylık 225 saat esası — sözleşmeye göre değişebilir",
    });
  }

  const toplam = kalemler.reduce((s, k) => s + k.tutar, 0);
  return { kalemler, toplam: yuvarla(toplam), uyarilar, tarifeYili: yil };
}
