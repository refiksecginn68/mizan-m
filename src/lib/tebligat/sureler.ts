// E-Tebligat süre hesabı — TEK KAYNAK. Yeni tür eklemek/düzeltmek için
// sadece burası değişir, koda gömülmez (bkz. görev talimatı).
//
// ⚠ UYARI — KASITLI OLARAK KÜÇÜK TABLO: Emin olunmayan bir tebligat türü
// için süre ÜRETİLMEZ (null döner, arayüz "elle giriniz" gösterir). Uydurulmuş
// bir süre, süre göstermemekten daha tehlikelidir.
//
// ⚠ Dini bayram tatilleri (Ramazan/Kurban) hesaba KATILMAZ — tarihleri yıldan
// yıla kaydığı için güvenilir kaynaksız üretilmedi. Bu, hesaplanan son günün
// gerçek yasal süreden birkaç gün ERKEN çıkmasına yol açabilir (güvenli yön:
// geç göstermek değil, erken uyarmak).

// 7201 sayılı Tebligat Kanunu m.7/a + Elektronik Tebligat Yönetmeliği m.9(1):
// muhatabın adresine ulaştığı tarihi izleyen 5. günün sonunda tebliğ sayılır.
export const ELEKTRONIK_TEBLIGAT_GUN = 5;

export interface SureKurali {
  gun: number;
  dayanak: string;
}

// Sadece genel/istisnasız kabul edilen, sık atıf yapılan süreler. Özel kanun/
// mahkeme türüne göre farklılaşan haller (ör. ceza muhakemesi itiraz süreleri,
// idare hukukunda özel süreler) BİLİNÇLİ OLARAK dışarıda bırakıldı.
export const SURE_KURALLARI: Record<string, SureKurali> = {
  hmk_cevap: { gun: 14, dayanak: "HMK m.127 — cevaba cevap/cevap dilekçesi süresi 2 hafta" },
  hmk_istinaf: { gun: 14, dayanak: "HMK m.345 — istinaf yoluna başvuru süresi 2 hafta" },
  hmk_temyiz: { gun: 14, dayanak: "HMK m.361 — temyiz süresi 2 hafta (genel kural)" },
  iik_odeme_emri_itiraz: { gun: 7, dayanak: "İİK m.62 — ödeme emrine itiraz süresi 7 gün" },
  iyuk_dava_acma: { gun: 30, dayanak: "İYUK m.7 — idari dava açma süresi 30 gün (genel kural)" },
};

export const TEBLIGAT_TUR_ETIKET: Record<string, string> = {
  hmk_cevap: "Dava dilekçesine cevap",
  hmk_istinaf: "Karara istinaf",
  hmk_temyiz: "Karara temyiz",
  iik_odeme_emri_itiraz: "İcra ödeme emrine itiraz",
  iyuk_dava_acma: "İdari işleme karşı dava",
};

const RESMI_TATIL_SABIT: Array<[number, number]> = [
  [1, 1], [4, 23], [5, 1], [5, 19], [8, 30], [10, 29],
];

function ayGunEsit(d: Date, ay: number, gun: number) {
  return d.getMonth() + 1 === ay && d.getDate() === gun;
}

function resmiTatilMi(d: Date): boolean {
  return RESMI_TATIL_SABIT.some(([ay, gun]) => ayGunEsit(d, ay, gun));
}

// HMK m.102 — adli tatil 20 Temmuz - 31 Ağustos; bu dönemde bazı süreler işlemez.
function adliTatilMi(d: Date): boolean {
  const ay = d.getMonth() + 1;
  const gun = d.getDate();
  return (ay === 7 && gun >= 20) || ay === 8;
}

function haftaSonuMu(d: Date): boolean {
  const g = d.getDay();
  return g === 0 || g === 6;
}

// Son gün tatile denk gelirse izleyen ilk iş günüdür (İİK m.19/3 mantığı).
function ilkIsGunu(tarih: Date): Date {
  const r = new Date(tarih);
  while (haftaSonuMu(r) || resmiTatilMi(r) || adliTatilMi(r)) {
    r.setDate(r.getDate() + 1);
  }
  return r;
}

export function tebligTarihiHesapla(gonderimTarihi: Date): Date {
  const d = new Date(gonderimTarihi);
  d.setDate(d.getDate() + ELEKTRONIK_TEBLIGAT_GUN);
  return d;
}

export interface SureSonucu {
  tebligTarihi: Date;
  sonGun: Date | null;
  dayanak: string | null;
  elleGiriniz: boolean;
}

// Tebligat günü hesaba katılmaz (süre ertesi günden başlar) — Date.setDate ile
// eklenen gün sayısı bunu doğal olarak sağlar.
export function sureHesapla(gonderimTarihi: Date, tur: string | null): SureSonucu {
  const tebligTarihi = tebligTarihiHesapla(gonderimTarihi);
  const kural = tur ? SURE_KURALLARI[tur] : undefined;

  if (!kural) {
    return { tebligTarihi, sonGun: null, dayanak: null, elleGiriniz: true };
  }

  const sonGunHam = new Date(tebligTarihi);
  sonGunHam.setDate(sonGunHam.getDate() + kural.gun);
  const sonGun = ilkIsGunu(sonGunHam);

  return { tebligTarihi, sonGun, dayanak: kural.dayanak, elleGiriniz: false };
}
