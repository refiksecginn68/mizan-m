// Karar metnini yapısına göre böler (FAZ 2.1).
//
// Desenler gerçek emsal_doc_cache içeriği incelenerek çıkarıldı (uydurulmadı):
// - Hukuk Dairesi kararlarında yaygın harfli düzen: A) Davacı.. B) Davalı..
//   C) Yerel Mahkeme.. D) Temyiz: E) Gerekçe: F) Sonuç:
// - Ceza Dairesi kararlarında yaygın Romen rakamlı düzen: I. HUKUKÎ SÜREÇ
//   II. TEMYİZ SEBEPLERİ III. OLAY VE OLGULAR IV. GEREKÇE ve KARAR
// ⚠ Canlı ölçümde 175 gerçek karardan yalnızca ~%14'ünde bu iki düzenden biri
// bulundu (bkz. FAZ 2 raporu). Kalanı FALLBACK'e düşer — bu oran gizlenmeden
// raporlanmalıdır.

import { trLower } from "@/lib/services/bedesten";

export type KanonikBolum =
  | "TARAFLAR" | "DAVA_KONUSU" | "ILK_DERECE" | "TEMYIZ_ISTINAF_SEBEPLERI"
  | "GEREKCE" | "HUKUM" | "FALLBACK";

export interface KararChunk {
  bolum: KanonikBolum;
  baslikMetni: string | null;
  metin: string;
}

export interface KararKunye {
  mahkeme: string | null;
  esasNo: string | null;
  kararNo: string | null;
}

// ── Künye çıkarımı ──────────────────────────────────────────────────────────
// "9. Hukuk Dairesi         2015/11469 E.  ,  2015/20235 K." (metnin ilk satırı)
const KUNYE_DESENI = /^(.{3,60}?)\s+(\d{4}\/\d{1,6})\s*E\.\s*,?\s*(\d{4}\/\d{1,6})\s*K\./m;

export function karariKunyeCikar(metin: string): KararKunye {
  const m = metin.match(KUNYE_DESENI);
  if (!m) return { mahkeme: null, esasNo: null, kararNo: null };
  return { mahkeme: m[1].trim(), esasNo: m[2], kararNo: m[3] };
}

// ⚠ Desenler trLower() ile küçültülmüş metne karşı test edilir — düz `/i`
// bayrağı Türkçe noktasız "I"yı güvenilir küçültmez (bkz. bedesten.ts:trLower,
// bu proje boyunca üç ayrı dosyada bu tuzağa düşüldü). Bu yüzden desenlerde
// /i YOK, hepsi zaten küçük harfle yazıldı ve karşılaştırma trLower(baslik)
// üzerinden yapılıyor.

// ── Harfli düzen (Hukuk Dairesi) ────────────────────────────────────────────
const HARFLI_BASLIK_HARITASI: { desen: RegExp; bolum: KanonikBolum }[] = [
  { desen: /davac[ıi]/, bolum: "TARAFLAR" },
  { desen: /daval[ıi]/, bolum: "TARAFLAR" },
  { desen: /yerel mahkeme/, bolum: "ILK_DERECE" },
  { desen: /temyiz/, bolum: "TEMYIZ_ISTINAF_SEBEPLERI" },
  { desen: /gerekçe/, bolum: "GEREKCE" },
  { desen: /sonuç/, bolum: "HUKUM" },
];

interface BaslikEslesme { index: number; baslikMetni: string; bolum: KanonikBolum }

function harfliBasliklariBul(metin: string): BaslikEslesme[] {
  const desen = /^([A-F])\)\s*([^:\n]{3,80}):/gm;
  const sonuc: BaslikEslesme[] = [];
  let m: RegExpExecArray | null;
  while ((m = desen.exec(metin))) {
    const baslikMetni = trLower(m[2].trim());
    const eslesen = HARFLI_BASLIK_HARITASI.find((h) => h.desen.test(baslikMetni));
    sonuc.push({ index: m.index, baslikMetni: m[0], bolum: eslesen?.bolum ?? "DAVA_KONUSU" });
  }
  return sonuc;
}

// ── Romen rakamlı düzen (Ceza Dairesi) ──────────────────────────────────────
// ⚠ Bölüm başlığı SÖZCÜKLERİ dairelere/yıllara göre değişiyor — canlı 175 karar
// üzerinde en az İKİ farklı Romen-rakamlı vokabüler görüldü (HUKUKÎ SÜREÇ/...
// ve DAVA/CEVAP/İLK DERECE MAHKEMESİ KARARI/İSTİNAF/TEMYİZ/KARAR). İkisi de
// eklendi; başka varyantlar DAVA_KONUSU'na (en zararsız varsayılan) düşer.
const ROMEN_BASLIK_HARITASI: { desen: RegExp; bolum: KanonikBolum }[] = [
  { desen: /hukuki süreç|hukukî süreç/, bolum: "ILK_DERECE" },
  { desen: /^cevap$/, bolum: "TARAFLAR" },
  { desen: /temyiz sebepleri|istinaf sebepleri|^istinaf$|^temyiz$/, bolum: "TEMYIZ_ISTINAF_SEBEPLERI" },
  { desen: /olay ve olgular|^dava$/, bolum: "DAVA_KONUSU" },
  { desen: /ilk derece mahkemesi kararı/, bolum: "ILK_DERECE" },
  { desen: /gerekçe/, bolum: "GEREKCE" },
  { desen: /^karar$/, bolum: "HUKUM" },
];

function romenBasliklariBul(metin: string): BaslikEslesme[] {
  const desen = /^([IVX]{1,4})\.\s*([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ \s]{2,50})$/gm;
  const sonuc: BaslikEslesme[] = [];
  let m: RegExpExecArray | null;
  while ((m = desen.exec(metin))) {
    const baslikMetni = trLower(m[2].trim());
    const eslesen = ROMEN_BASLIK_HARITASI.find((h) => h.desen.test(baslikMetni));
    sonuc.push({ index: m.index, baslikMetni: m[0], bolum: eslesen?.bolum ?? "DAVA_KONUSU" });
  }
  return sonuc;
}

// ── Düz büyük-harf ":" başlığı (harf/Romen ÖNEKSİZ) ─────────────────────────
// Fallback kümesindeki 150 kararı tarayarak bulundu: Hukuk Genel Kurulu, Ceza
// Genel Kurulu ve BAM kararlarında harf/Romen numarası OLMADAN doğrudan
// "GEREKÇE:", "SONUÇ:", "DAVACI :" gibi başlıklar kullanılıyor. "TÜRK MİLLETİ
// ADINA" (hüküm fıkrasından hemen önce gelen standart ibare, 175 kararın
// 20'sinde görüldü) ve "-KARAR-" ayrı işaretler olarak eklendi.
const DUZ_BASLIK_HARITASI: { desen: RegExp; bolum: KanonikBolum }[] = [
  { desen: /^davac[ıi]\s*$/, bolum: "TARAFLAR" },
  { desen: /^daval[ıi]\s*$/, bolum: "TARAFLAR" },
  { desen: /^cevap\s*$/, bolum: "TARAFLAR" },
  { desen: /^vekili\s*$/, bolum: "TARAFLAR" },
  { desen: /^yargılama süreci\s*$/, bolum: "ILK_DERECE" },
  { desen: /^maddi olay\s*$/, bolum: "DAVA_KONUSU" },
  { desen: /^dava türü\s*:?.*$/, bolum: "DAVA_KONUSU" },
  { desen: /gerekçe|hukuki değerlendirme|delillerin değerlendirilmesi/, bolum: "GEREKCE" },
  { desen: /^sonuç\s*$/, bolum: "HUKUM" },
  { desen: /^-\s*karar\s*-$/, bolum: "HUKUM" },
  { desen: /^türk milleti adına\s*$/, bolum: "HUKUM" },
];

// Yalnızca ":" ile biten VEYA "-KARAR-"/"TÜRK MİLLETİ ADINA" kalıbındaki satırlar
// başlık adayı sayılır — aksi halde normal düz-yazı cümleleri (bunlar da büyük
// harfle başlayabilir) yanlışlıkla bölüm sınırı sayılır.
const DUZ_BASLIK_DESENI = /^([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ İ\s]{1,45}):|^-\s*KARAR\s*-$|^T[ÜU]RK M[İI]LLET[İI] ADINA\s*$/gm;

function duzBasliklariBul(metin: string): BaslikEslesme[] {
  const sonuc: BaslikEslesme[] = [];
  let m: RegExpExecArray | null;
  DUZ_BASLIK_DESENI.lastIndex = 0;
  while ((m = DUZ_BASLIK_DESENI.exec(metin))) {
    const hamBaslik = (m[1] ?? m[0]).trim();
    const baslikNorm = trLower(hamBaslik);
    const eslesen = DUZ_BASLIK_HARITASI.find((h) => h.desen.test(baslikNorm));
    if (eslesen) sonuc.push({ index: m.index, baslikMetni: m[0], bolum: eslesen.bolum });
  }
  return sonuc;
}

// ── Fallback: sabit pencere, örtüşmeli ──────────────────────────────────────
const FALLBACK_PENCERE = 1500;
const FALLBACK_ORTUSME = 200;

function fallbackBol(metin: string): KararChunk[] {
  const parcalar: KararChunk[] = [];
  let start = 0;
  while (start < metin.length) {
    const end = Math.min(start + FALLBACK_PENCERE, metin.length);
    parcalar.push({ bolum: "FALLBACK", baslikMetni: null, metin: metin.slice(start, end) });
    if (end >= metin.length) break;
    start = end - FALLBACK_ORTUSME;
  }
  return parcalar;
}

export interface BolmeSonucu {
  chunks: KararChunk[];
  yontem: "harfli" | "romen" | "duz" | "fallback";
}

/** Kararı yapısına göre böler; en az 2 başlık bulunamazsa fallback'e düşer. */
export function karariBol(metin: string): BolmeSonucu {
  const denemeler: { baslıklar: BaslikEslesme[]; yontem: "harfli" | "romen" | "duz" }[] = [
    { baslıklar: harfliBasliklariBul(metin), yontem: "harfli" },
    { baslıklar: romenBasliklariBul(metin), yontem: "romen" },
    { baslıklar: duzBasliklariBul(metin), yontem: "duz" },
  ];
  const secilen = denemeler.find((d) => d.baslıklar.length >= 2);

  if (!secilen) {
    return { chunks: fallbackBol(metin), yontem: "fallback" };
  }

  const baslıklar = secilen.baslıklar;
  const chunks: KararChunk[] = [];
  // Başlıktan önceki giriş metni (varsa) — mahkeme/dava özeti içerir, DAVA_KONUSU say
  if (baslıklar[0].index > 40) {
    const giris = metin.slice(0, baslıklar[0].index).trim();
    if (giris.length > 20) chunks.push({ bolum: "DAVA_KONUSU", baslikMetni: null, metin: giris });
  }
  for (let i = 0; i < baslıklar.length; i++) {
    const b = baslıklar[i];
    const sonrakiIndex = i + 1 < baslıklar.length ? baslıklar[i + 1].index : metin.length;
    const govde = metin.slice(b.index, sonrakiIndex).trim();
    if (govde.length > 0) chunks.push({ bolum: b.bolum, baslikMetni: b.baslikMetni, metin: govde });
  }
  return { chunks, yontem: secilen.yontem };
}

// ── Atıf maddesi çıkarımı (FAZ 2.2) ─────────────────────────────────────────
// Tekil sorgu ayrıştırmasından (query-parser.ts) FARKLI: burada bir sorgu değil
// TÜM karar metni taranır, metinde geçen HER "kanun madde" atfı toplanır.
import { KISALTMA_HARITASI } from "@/lib/arama/sozluk/kanun-kisaltmalari";

export interface MaddeAtfiBulgu { kanun: string; madde: string }

// "5237 sayılı TCK'nın 89/1, 89/2-b-e, 62, 52. maddeleri" gibi VİRGÜLLÜ ÇOKLU
// madde listelerini de yakalar (canlı örneklerde çok sık görüldü).
const KISALTMA_MADDE_DESENI = new RegExp(
  `\\b(${Object.keys(KISALTMA_HARITASI).filter((k) => !k.includes(" ")).join("|")})` +
  `\\s*(?:'?[nN][ıiİI]n)?\\s*((?:\\d{1,4}(?:\\/[a-zçğıöşü0-9-]+)?\\s*,?\\s*)+)\\s*madde`,
  "g"
);

/** Karar metnindeki TÜM kanun-madde atıflarını (dedupe edilmiş) döner. */
export function documentMaddeleriCikar(metin: string): MaddeAtfiBulgu[] {
  const duz = trLower(metin).replace(/\./g, "");
  const bulgular = new Map<string, MaddeAtfiBulgu>();
  let m: RegExpExecArray | null;
  KISALTMA_MADDE_DESENI.lastIndex = 0;
  while ((m = KISALTMA_MADDE_DESENI.exec(duz))) {
    const kanun = KISALTMA_HARITASI[m[1]];
    const maddeler = m[2].split(",").map((s) => s.trim().split("/")[0]).filter(Boolean);
    for (const madde of maddeler) {
      const key = `${kanun}-${madde}`;
      if (!bulgular.has(key)) bulgular.set(key, { kanun, madde });
    }
  }
  return Array.from(bulgular.values());
}

/** Embedding'e gönderilecek metne künye prefix'i ekler (bağlamı güçlendirir). */
export function chunkPrefixliMetin(chunk: KararChunk, kunye: KararKunye): string {
  const kunyeStr = [kunye.mahkeme, kunye.esasNo ? `${kunye.esasNo} E.` : null, kunye.kararNo ? `${kunye.kararNo} K.` : null]
    .filter(Boolean).join(" · ");
  return `${kunyeStr}${kunyeStr ? " — " : ""}${chunk.bolum}\n${chunk.metin}`;
}
