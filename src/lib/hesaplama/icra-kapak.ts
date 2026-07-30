// İCRA KAPAK HESABI — saf, deterministik. [FAZ 2 önceliği]
// Kalemler ve "nasıl hesaplandı" formülleri şeffaf; oranlar yıl tarifesinden gelir.
import type { HesapKalemi, HesapSonucu } from "./types";
import { GENEL_UYARI } from "./types";
import { tarifeGetir, VARSAYILAN_YIL, type TarifeYili } from "./tarifeler";
import { faizHesapla, gunFarki, yuvarla, format } from "./faiz";

export type TakipTuru = "ilamsiz-genel" | "ilamsiz-kambiyo" | "ilamli" | "mts";
export type TahsilAsamasi = "yok" | "haciz-oncesi" | "haciz-sonrasi" | "satis-sonrasi";
export type FaizTuru = "yok" | "yasal" | "avans" | "ticari" | "ozel";

export interface IcraKapakGirdi {
  takipTuru: TakipTuru;
  anaPara: number;
  takipTarihi: string; // ISO
  odemeTarihi: string; // ISO
  faizTuru: FaizTuru;
  ozelFaizOrani?: number; // faizTuru "ozel" ise yıllık oran (0.30 = %30)
  borcluSayisi: number;
  vekilVar: boolean;
  tahsilAsamasi: TahsilAsamasi;
  yil?: TarifeYili;
}

function faizOraniSec(t: ReturnType<typeof tarifeGetir>, girdi: IcraKapakGirdi): number {
  switch (girdi.faizTuru) {
    case "yasal": return t.faiz.yasalFaiz.deger;
    case "avans": return t.faiz.avansFaizi.deger;
    case "ticari": return t.faiz.ticariTemerrutFaizi.deger;
    case "ozel": return girdi.ozelFaizOrani ?? 0;
    default: return 0;
  }
}

export function icraKapakHesapla(girdi: IcraKapakGirdi): HesapSonucu {
  const yil = girdi.yil ?? VARSAYILAN_YIL;
  const t = tarifeGetir(yil);
  const kalemler: HesapKalemi[] = [];
  const uyarilar: string[] = [GENEL_UYARI];
  const ilamsiz = girdi.takipTuru === "ilamsiz-genel" || girdi.takipTuru === "ilamsiz-kambiyo";

  // 1) İcraya başvurma harcı (maktu)
  const basvurma = t.icra.basvurmaHarci.deger;
  kalemler.push({
    ad: "İcraya başvurma harcı",
    tutar: yuvarla(basvurma),
    formul: `Maktu (${yil} tarifesi)`,
    not: t.icra.basvurmaHarci.dogrulanmadi ? "değer doğrulanmadı" : undefined,
  });

  // 2) Peşin harç (ilamsız/kambiyo) | MTS harcı | ilamlı → yok
  let pesinHarc = 0;
  if (ilamsiz) {
    pesinHarc = girdi.anaPara * t.icra.pesinHarcOrani.deger;
    kalemler.push({
      ad: "Peşin harç",
      tutar: yuvarla(pesinHarc),
      formul: `${format(girdi.anaPara)} × ‰${(t.icra.pesinHarcOrani.deger * 1000).toFixed(0)} (ana para)`,
    });
  } else if (girdi.takipTuru === "mts") {
    const mts = girdi.anaPara * t.icra.mtsHarcOrani.deger;
    kalemler.push({
      ad: "MTS başvuru harcı",
      tutar: yuvarla(mts),
      formul: `${format(girdi.anaPara)} × %${(t.icra.mtsHarcOrani.deger * 100).toFixed(0)} (ana para)`,
    });
    pesinHarc = 0; // MTS'te peşin harç yok; MTS harcı ayrı kalem
  } else {
    // ilamlı → peşin harç yok
    kalemler.push({ ad: "Peşin harç", tutar: 0, formul: "İlamlı takipte peşin harç alınmaz" });
  }

  // 3) İşlemiş faiz (gün bazlı)
  const faizOrani = faizOraniSec(t, girdi);
  let islemisF = 0;
  if (faizOrani > 0 && girdi.faizTuru !== "yok") {
    const fSon = faizHesapla({
      anaPara: girdi.anaPara,
      tur: "basit",
      donemler: [{ baslangic: girdi.takipTarihi, bitis: girdi.odemeTarihi, yillikOran: faizOrani }],
    });
    islemisF = fSon.toplam;
    const gun = gunFarki(girdi.takipTarihi, girdi.odemeTarihi);
    kalemler.push({
      ad: "İşlemiş faiz",
      tutar: islemisF,
      formul: `${format(girdi.anaPara)} × %${(faizOrani * 100).toFixed(2)} × ${gun}/365 gün`,
      not: girdi.faizTuru !== "yasal" ? "oran doğrulanmadı — tarifeye bakınız" : undefined,
    });
  }

  // 4) Tahsil harcı (aşamaya göre) — matrah: ana para + işlemiş faiz; peşin harç düşülür
  let tahsilHarci = 0;
  if (girdi.tahsilAsamasi !== "yok") {
    const oranObj =
      girdi.tahsilAsamasi === "haciz-oncesi" ? t.icra.tahsilHarci.tebligSonrasiHacizOncesi :
      girdi.tahsilAsamasi === "haciz-sonrasi" ? t.icra.tahsilHarci.hacizSonrasiSatisOncesi :
      t.icra.tahsilHarci.satisSonrasi;
    const matrah = girdi.anaPara + islemisF;
    const brut = matrah * oranObj.deger;
    tahsilHarci = Math.max(0, brut - pesinHarc); // peşin harç mahsup
    kalemler.push({
      ad: "Tahsil harcı",
      tutar: yuvarla(tahsilHarci),
      formul: `(${format(matrah)} × %${(oranObj.deger * 100).toFixed(2)}) − peşin harç ${format(pesinHarc)}`,
    });
  }

  // 5) Cezaevi harcı — tahsil harcı matrahı üzerinden
  if (tahsilHarci > 0) {
    const cezaevi = tahsilHarci * t.icra.cezaeviHarciOrani.deger;
    kalemler.push({
      ad: "Cezaevi harcı",
      tutar: yuvarla(cezaevi),
      formul: `${format(tahsilHarci)} × %${(t.icra.cezaeviHarciOrani.deger * 100).toFixed(0)}`,
      not: t.icra.cezaeviHarciOrani.dogrulanmadi ? "oran doğrulanmadı" : undefined,
    });
  }

  // 6) Vekalet pulu (vekil varsa)
  if (girdi.vekilVar) {
    kalemler.push({
      ad: "Vekalet pulu",
      tutar: yuvarla(t.icra.vekaletPulu.deger),
      formul: "Maktu",
      not: t.icra.vekaletPulu.dogrulanmadi ? "değer doğrulanmadı" : undefined,
    });
  }

  // 7) Tebligat / gider avansı — borçlu sayısı çarpanı
  const tebligat = girdi.borcluSayisi * t.icra.tebligatGideriBorcluBasina.deger;
  kalemler.push({
    ad: "Tebligat / gider avansı",
    tutar: yuvarla(tebligat),
    formul: `${girdi.borcluSayisi} borçlu × ${format(t.icra.tebligatGideriBorcluBasina.deger)}`,
    not: "tahmini gider — güncel PTT tarifesiyle teyit edin",
  });

  // 8) Vekalet ücreti (AAÜT — nispi/maktu büyüğü)
  if (girdi.vekilVar) {
    const nispi = nispiVekalet(girdi.anaPara, t.aaut.nispiDilimler.deger);
    const maktu = t.aaut.icraMaktuGenel.deger;
    const vekalet = Math.max(nispi, maktu);
    kalemler.push({
      ad: "Vekalet ücreti (AAÜT)",
      tutar: yuvarla(vekalet),
      formul: nispi > maktu
        ? `Nispi tarife: ${format(nispi)}`
        : `Maktu ${format(maktu)} (nispi ${format(nispi)} < maktu)`,
      not: t.aaut.nispiDilimler.dogrulanmadi ? "nispi dilim oranları doğrulanmadı" : undefined,
    });
  }

  const toplam = kalemler.reduce((s, k) => s + k.tutar, 0);
  return { kalemler, toplam: yuvarla(toplam), uyarilar, tarifeYili: yil };
}

// AAÜT nispi: dilimlere böl, her dilime kendi oranı
export function nispiVekalet(deger: number, dilimler: readonly { ustSinir: number; oran: number }[]): number {
  let kalan = deger;
  let onceki = 0;
  let toplam = 0;
  for (const d of dilimler) {
    if (kalan <= 0) break;
    const dilimGenislik = d.ustSinir - onceki;
    const uygulanan = Math.min(kalan, dilimGenislik);
    toplam += uygulanan * d.oran;
    kalan -= uygulanan;
    onceki = d.ustSinir;
  }
  return yuvarla(toplam);
}
