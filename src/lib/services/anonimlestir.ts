// Kamuya açık kaynaklardan (karar metinleri, resmî formlar) alınan metinlerdeki
// kişisel verileri temizler. Korpusa yalnızca anonimleştirilmiş metin girer.

export interface AnonimSonuc {
  metin: string;
  /** Hangi türden kaç maskeleme yapıldı — denetlenebilirlik için */
  maskeler: Record<string, number>;
}

const KURALLAR: { ad: string; desen: RegExp; yerine: string }[] = [
  // T.C. kimlik no — 11 hane, sözcük sınırıyla
  { ad: "tc_kimlik", desen: /\b[1-9]\d{10}\b/g, yerine: "[T.C. KİMLİK NO]" },
  // IBAN
  { ad: "iban", desen: /\bTR\d{2}[\s]?(?:\d{4}[\s]?){5}\d{2}\b/gi, yerine: "[IBAN]" },
  // Telefon (0xxx xxx xx xx / +90...) — ayırıcı yalnızca rakamlar ARASINDA eşleşir,
  // sondaki boşluk/satır sonu yutulmasın
  { ad: "telefon", desen: /(?:\+90[\s-]?|\b0)\d(?:[\s-]?\d){9}\b/g, yerine: "[TELEFON]" },
  // E-posta
  { ad: "eposta", desen: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g, yerine: "[E-POSTA]" },
  // Dosya/esas/karar numarası: 2023/1234 E. veya K.
  { ad: "dosya_no", desen: /\b(19|20)\d{2}\s*\/\s*\d{1,6}\s*(?=[EK]\.)/g, yerine: "[YIL]/[NO] " },
  // Vergi no (10 hane)
  { ad: "vergi_no", desen: /\bVergi\s*(?:Kimlik\s*)?No\s*:?\s*\d{10}\b/gi, yerine: "Vergi No: [VERGİ NO]" },
];

// "Davacı ... Ahmet Yılmaz" gibi künye satırlarındaki ad-soyadı maskele.
// Yalnızca taraf etiketinden sonra gelen özel adları hedefler — metnin gövdesindeki
// kurum/kanun adlarına dokunmaz.
const TARAF_ETIKETLERI =
  "DAVACI|DAVALI|MÜŞTEKİ|ŞÜPHELİ|SANIK|KATILAN|MAĞDUR|ALACAKLI|BORÇLU|" +
  "İTİRAZ EDEN|KEŞİDECİ|MUHATAP|VEKİLİ|İSTİNAF EDEN|TEMYİZ EDEN|KARŞI TARAF";

// Türkçe büyük/küçük harf sınıfları — proje ES5 hedeflediği için \p{..} (u bayrağı) kullanılamaz
const BUYUK = "A-ZÇĞİÖŞÜ";
const KUCUK = "a-zçğıöşü";
const OZEL_AD = new RegExp(`[${BUYUK}][${KUCUK}]+(?:\\s+[${BUYUK}][${KUCUK}]+){1,2}`);

export function anonimlestir(ham: string): AnonimSonuc {
  const maskeler: Record<string, number> = {};
  let metin = ham;

  for (const k of KURALLAR) {
    let sayi = 0;
    metin = metin.replace(k.desen, () => {
      sayi++;
      return k.yerine;
    });
    if (sayi) maskeler[k.ad] = sayi;
  }

  // Taraf künyelerindeki ad-soyad
  const kunyeDesen = new RegExp(
    `^(\\s*(?:${TARAF_ETIKETLERI})\\s*:?\\s*)(.+)$`,
    "gm"
  );
  let adSayisi = 0;
  metin = metin.replace(kunyeDesen, (tam, etiket: string, kalan: string) => {
    // Zaten yer tutucuysa dokunma
    if (/^\s*\[/.test(kalan)) return tam;
    const yeni = kalan.replace(OZEL_AD, () => {
      adSayisi++;
      return "[AD SOYAD]";
    });
    return etiket + yeni;
  });
  if (adSayisi) maskeler["ad_soyad"] = adSayisi;

  // "Av. Ahmet Yılmaz" → "Av. [AD SOYAD]"
  let avSayisi = 0;
  const avDesen = new RegExp(
    `\\bAv\\.\\s+(?!\\[)[${BUYUK}][${KUCUK}]+(?:\\s+[${BUYUK}][${KUCUK}]+){0,2}`,
    "g"
  );
  metin = metin.replace(avDesen, () => {
    avSayisi++;
    return "Av. [AD SOYAD]";
  });
  if (avSayisi) maskeler["avukat_adi"] = avSayisi;

  return { metin, maskeler };
}

/** Anonimleştirme sonrası kişisel veri kalıntısı kaldı mı — doğrulama için. */
export function kisiselVeriKalintisi(metin: string): string[] {
  const bulgular: string[] = [];
  if (/\b[1-9]\d{10}\b/.test(metin)) bulgular.push("T.C. kimlik no");
  if (/\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/.test(metin)) bulgular.push("e-posta");
  if (/\bTR\d{2}[\s]?(?:\d{4}[\s]?){5}\d{2}\b/i.test(metin)) bulgular.push("IBAN");
  return bulgular;
}
