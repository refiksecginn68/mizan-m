// Yurt dışındaki AI sağlayıcılarına (Anthropic, Cohere) giden METİN içeriğinden
// kişisel verileri çıkarıp takma değerle değiştiren, cevap dönünce geri dolduran katman.
//
// anonimlestir.ts'den (kamuya açık içtihat korpusu için, GERİ DÖNÜŞSÜZ) FARKLIDIR:
// bu modül İSTEK BAZLI ve TERSİNİRDİR — eşleme yalnızca bir istek ömrü boyunca bellekte
// tutulur, kalıcı saklanmaz.
//
// Kapsam dışı: ham ses/görüntü/video (fal.ai'ye maskelenemeden gider — bkz.
// content/legal/yurt-disina-aktarim-bildirimi.v1.md madde 5) ve Anthropic vision OCR'a
// giden taranmış görsel/PDF (aynı istisna, bkz. DOĞRULANAMAYANLAR raporu).

export interface MaskelemeSonucu {
  /** AI'ya gönderilecek, kimlik bilgisi içermeyen metin */
  maskeliMetin: string;
  /** Cevapta geri doldurma için eşleme — yalnızca bu isteğin ömrü boyunca tutulur */
  esleme: Map<string, string>;
  /** Denetlenebilirlik için: hangi türden kaç maskeleme yapıldı */
  sayaclar: Record<string, number>;
}

interface BilinenDeger {
  deger: string;
  tur: "kisi" | "tckn" | "vkn" | "adres" | "dosyaNo" | "iban" | "telefon" | "eposta";
}

const KURAL_DESENLERI: { tur: BilinenDeger["tur"]; etiket: string; desen: RegExp }[] = [
  { tur: "tckn", etiket: "TCKN", desen: /\b[1-9]\d{10}\b/g },
  { tur: "vkn", etiket: "VKN", desen: /\b\d{10}\b(?!\d)/g },
  { tur: "iban", etiket: "IBAN", desen: /\bTR\d{2}[\s]?(?:\d{4}[\s]?){5}\d{2}\b/gi },
  { tur: "telefon", etiket: "TELEFON", desen: /(?:\+90[\s-]?|\b0)\d(?:[\s-]?\d){9}\b/g },
  { tur: "eposta", etiket: "EPOSTA", desen: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g },
  { tur: "dosyaNo", etiket: "DOSYA-NO", desen: /\b(19|20)\d{2}\s*\/\s*\d{1,6}(?=\s*[EK]\.)/g },
];

function tcknGecerli(deger: string): boolean {
  const d = deger.split("").map(Number);
  if (d.length !== 11 || d[0] === 0) return false;
  const tek = d[0] + d[2] + d[4] + d[6] + d[8];
  const cift = d[1] + d[3] + d[5] + d[7];
  const h10 = (tek * 7 - cift) % 10;
  const h11 = (d.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  return h10 === d[9] && h11 === d[10];
}

/**
 * Maskeler. `bilinenDegerler`, çağıranın (UYAP'tan çekilmiş taraf adı/TCKN/dosya no gibi)
 * ZATEN BİLDİĞİ değerlerdir — asıl güç buradadır: tahmine gerek yok, kesin string eşleşmesi.
 * Kural tabanlı regex (TCKN/IBAN/telefon/e-posta) bunu TAMAMLAR, yerini tutmaz.
 */
export function maskele(hamMetin: string, bilinenDegerler: BilinenDeger[] = []): MaskelemeSonucu {
  let metin = hamMetin;
  const esleme = new Map<string, string>();
  const sayaclar: Record<string, number> = {};
  const sayaç = (tur: string) => (sayaclar[tur] = (sayaclar[tur] ?? 0) + 1);

  // 1) Yapısal eşleme: bilinen değerler, en uzundan kısaya (alt-string çakışmasını önlemek için)
  const siraliBilinen = [...bilinenDegerler]
    .filter((b) => b.deger && b.deger.trim().length > 1)
    .sort((a, b) => b.deger.length - a.deger.length);

  const etiketSayaci: Record<string, number> = {};
  const etiketOnEk: Record<BilinenDeger["tur"], string> = {
    kisi: "KİŞİ", tckn: "TCKN", vkn: "VKN", adres: "ADRES",
    dosyaNo: "DOSYA-NO", iban: "IBAN", telefon: "TELEFON", eposta: "EPOSTA",
  };

  for (const b of siraliBilinen) {
    const zatenVarMi = Array.from(esleme.entries()).find(([, gercek]) => gercek === b.deger);
    let etiket: string;
    if (zatenVarMi) {
      etiket = zatenVarMi[0];
    } else {
      const onEk = etiketOnEk[b.tur];
      etiketSayaci[onEk] = (etiketSayaci[onEk] ?? 0) + 1;
      etiket = `[${onEk}-${etiketSayaci[onEk]}]`;
      esleme.set(etiket, b.deger);
    }
    const kacis = b.deger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const oncesi = metin;
    metin = metin.replace(new RegExp(kacis, "g"), etiket);
    if (metin !== oncesi) sayaç(`yapisal_${b.tur}`);
  }

  // 2) Kural tabanlı regex — yapısal eşlemeden kaçanları yakalar
  for (const k of KURAL_DESENLERI) {
    metin = metin.replace(k.desen, (eslesme) => {
      if (k.tur === "tckn" && !tcknGecerli(eslesme)) return eslesme; // yanlış pozitifi maskeleme
      if (esleme.has(`[${eslesme}]`)) return `[${eslesme}]`; // zaten maskelenmiş bir etiketin içine düşmesin
      const zatenVarMi = Array.from(esleme.entries()).find(([, gercek]) => gercek === eslesme);
      let etiket: string;
      if (zatenVarMi) {
        etiket = zatenVarMi[0];
      } else {
        etiketSayaci[k.etiket] = (etiketSayaci[k.etiket] ?? 0) + 1;
        etiket = `[${k.etiket}-${etiketSayaci[k.etiket]}]`;
        esleme.set(etiket, eslesme);
      }
      sayaç(`kural_${k.tur}`);
      return etiket;
    });
  }

  return { maskeliMetin: metin, esleme, sayaclar };
}

/** AI cevabındaki takma değerleri gerçek değerlerle geri doldurur. */
export function geriDoldur(aiMetni: string, esleme: Map<string, string>): string {
  let metin = aiMetni;
  for (const [etiket, gercek] of Array.from(esleme.entries())) {
    metin = metin.split(etiket).join(gercek);
  }
  return metin;
}

/** Maskeleme sonrası kalıntı kontrolü — çağrı öncesi son savunma hattı. */
export function sizintiKontrolu(metin: string): string[] {
  const bulgular: string[] = [];
  if (/\b[1-9]\d{10}\b/.test(metin)) {
    const olasi = metin.match(/\b[1-9]\d{10}\b/g) ?? [];
    if (olasi.some(tcknGecerli)) bulgular.push("T.C. kimlik no");
  }
  if (/\bTR\d{2}[\s]?(?:\d{4}[\s]?){5}\d{2}\b/i.test(metin)) bulgular.push("IBAN");
  if (/\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/.test(metin)) bulgular.push("e-posta");
  if (/(?:\+90[\s-]?|\b0)\d(?:[\s-]?\d){9}\b/.test(metin)) bulgular.push("telefon");
  return bulgular;
}

/**
 * Maskele + sızıntı kontrolü tek adımda. Sızıntı varsa çağrıyı ENGELLER (throw) —
 * "sessizce gönder" yerine "durdur ve logla" tercih edilmiştir (bkz. Bölüm 3 madde 6).
 */
export function guvenliMaskele(hamMetin: string, bilinenDegerler: BilinenDeger[] = []): MaskelemeSonucu {
  const sonuc = maskele(hamMetin, bilinenDegerler);
  const kalinti = sizintiKontrolu(sonuc.maskeliMetin);
  if (kalinti.length > 0) {
    console.error("[maskele] SIZINTI TESPİT EDİLDİ, çağrı engellendi:", kalinti);
    throw new Error(`Maskeleme sonrası kişisel veri kalıntısı tespit edildi: ${kalinti.join(", ")}`);
  }
  return sonuc;
}
