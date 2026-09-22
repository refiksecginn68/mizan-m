// Sorgu ayrıştırıcı — LLM YOK, saf kural tabanlı (FAZ 1.2).
// Madde/kanun atfı çıkarımı, esas/karar no tespiti, kavram genişletme.

import { trLower } from "@/lib/services/bedesten";
import { KISALTMA_HARITASI, KAVRAMDAN_KANUN } from "@/lib/arama/sozluk/kanun-kisaltmalari";
import { KAVRAM_GRUPLARI, kavramGrubuBul } from "@/lib/arama/sozluk/kavramlar";
import { kavramMaddeBul } from "@/lib/arama/sozluk/kavram-madde";

export interface MaddeAtfi {
  kanun: string | null;
  madde: string;
}

export interface EsasKararNo {
  esas: string | null;
  karar: string | null;
}

export interface AyristirilmisSorgu {
  /** Türkçe-güvenli küçük harfe çevrilmiş, fazla boşluğu temizlenmiş orijinal sorgu */
  normalize: string;
  maddeAtfi: MaddeAtfi | null;
  esasKarar: EsasKararNo;
  /** Sorgudaki kavramların eşanlamlarıyla genişletilmiş hâli (arama için ek varyant üretimine girdi) */
  genisletilmisKavramlar: string[];
}

/** Türkçe-güvenli normalizasyon: trim + çoklu boşluk + İ/I-duyarlı küçültme. */
export function normalizeQuery(q: string): string {
  return trLower(q).replace(/\s{2,}/g, " ").trim();
}

// "88.madde" · "88. madde" · "madde 88" · "88 inci madde" · "m.88" · "md 88" · "88 md"
const MADDE_DESENLERI: RegExp[] = [
  /\b(\d{1,4})\s*\.?\s*(?:inci|nci|ncı|uncu|üncü)?\s*madde\b/i,
  /\bmadde\s*(\d{1,4})\b/i,
  /\bm\.\s*(\d{1,4})\b/i,
  /\bmd\.?\s*(\d{1,4})\b/i,
  /\b(\d{1,4})\s*md\b/i,
];

/** Kanun kısaltması + madde numarasının BİTİŞİK geçtiği kalıp: "İİK 88", "İİK m.88", "iik88" */
function kanunBitisikMadde(qLower: string): MaddeAtfi | null {
  // Nokta işaretlerini kaldırılmış metin üzerinde dene — "İİK m.88" ve "iik88" ikisi de yakalanır
  const duzMetin = qLower.replace(/\./g, "");
  const kisaltmalar = Object.keys(KISALTMA_HARITASI).sort((a, b) => b.length - a.length);
  for (const kis of kisaltmalar) {
    if (kis.includes(" ")) continue; // "iş k" gibi boşluklu girdiler bu kalıpta aranmaz
    const kacis = kis.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const desen = new RegExp(`\\b${kacis}\\s*m?\\s*(\\d{1,4})\\b`, "i");
    const m = duzMetin.match(desen);
    if (m) return { kanun: KISALTMA_HARITASI[kis], madde: m[1] };
  }
  return null;
}

/** Sorguda geçen herhangi bir kanun kısaltmasını (madde numarasından bağımsız) bulur. */
function kanunGeciyorMu(qLower: string): string | null {
  const duzMetin = qLower.replace(/\./g, "");
  const kelimeler = duzMetin.split(/\s+/);
  for (const kelime of kelimeler) {
    if (KISALTMA_HARITASI[kelime]) return KISALTMA_HARITASI[kelime];
  }
  return null;
}

/** Madde/kanun atfını çıkarır. Kanun yoksa kavram sözlüğünden çıkarım dener (madde 1.2-d). */
export function extractMaddeAtfi(qLower: string): MaddeAtfi | null {
  const bitisik = kanunBitisikMadde(qLower);
  if (bitisik) return bitisik;

  let madde: string | null = null;
  for (const desen of MADDE_DESENLERI) {
    const m = qLower.match(desen);
    if (m) { madde = m[1]; break; }
  }
  if (!madde) return null;

  // Madde var, kanun sorguda açıkça geçmiyor — kavramdan çıkarım dene
  let kanun = kanunGeciyorMu(qLower);
  if (!kanun) {
    const kelimeler = qLower.split(/[^a-zçğıöşü]+/).filter(Boolean);
    for (const kelime of kelimeler) {
      if (KAVRAMDAN_KANUN[kelime]) { kanun = KAVRAMDAN_KANUN[kelime]; break; }
    }
  }
  // Kanun çıkarılamazsa BOŞ bırak — yanlış kanuna kilitlemek sonuç kaçırmaktan kötüdür
  return { kanun, madde };
}

// Bare "2023/1342": tüm sorgu YALNIZCA bu kalıptan ibaretse esas no say.
// Karışık sorgularda (ör. "2023/1342 tazminat") yanlış pozitifi önlemek için
// yalnızca TAM sorgu bu kalıba uyuyorsa devreye girer.
const BARE_ESAS_KALIBI = /^(\d{4}\/\d{1,6})$/;

/**
 * Esas/karar no çıkarır. route.ts:preprocessQuery ile aynı etiketli kalıpları
 * kapsar; EK olarak etiketsiz/bare "2023/1342" sorgusunu da esas no sayar
 * (FAZ 0'da tespit edilen "0 sonuç" hatasının kök nedeni buydu).
 */
export function extractEsasKarar(q: string): EsasKararNo {
  const bare = q.trim().match(BARE_ESAS_KALIBI);
  if (bare) return { esas: bare[1], karar: null };

  let metin = q;
  const take = (re: RegExp): string | null => {
    const m = metin.match(re);
    if (!m) return null;
    metin = metin.replace(m[0], " ");
    return m[1];
  };
  const esas =
    take(/\b(\d{4}\/\d{1,6})\s*(?:E\.|E\b|esas(?:\s*(?:no|sayılı))?)/i) ??
    take(/\besas(?:\s*no)?\s*[:.]?\s*(\d{4}\/\d{1,6})/i);
  const karar =
    take(/\b(\d{4}\/\d{1,6})\s*(?:K\.|K\b|karar(?:\s*(?:no|sayılı))?)/i) ??
    take(/\bkarar(?:\s*no)?\s*[:.]?\s*(\d{4}\/\d{1,6})/i);
  return { esas, karar };
}

/** Sorgudaki kavramları eşanlamlarıyla genişletir (deduplike edilmiş liste döner). */
export function genisletKavramlar(qLower: string): string[] {
  const bulunanlar = new Set<string>();
  for (const grup of KAVRAM_GRUPLARI) {
    const hepsi = [grup.ana, ...grup.esanlamlar];
    if (hepsi.some((t) => qLower.includes(t))) {
      hepsi.forEach((t) => bulunanlar.add(t));
    }
  }
  return Array.from(bulunanlar);
}

/** Tam ayrıştırma — route.ts'nin buildPhrases'inde ek arama varyantı üretmek için kullanılır. */
export function ayristirSorgu(q: string): AyristirilmisSorgu {
  const normalize = normalizeQuery(q);
  const maddeAtfi = extractMaddeAtfi(normalize);
  const esasKarar = extractEsasKarar(q);
  const genisletilmisKavramlar = genisletKavramlar(normalize);
  return { normalize, maddeAtfi, esasKarar, genisletilmisKavramlar };
}

/**
 * Madde/kanun atfından Bedesten'e gönderilecek EK arama terimi üretir.
 * Örn: {kanun:"İİK", madde:"88"} → "İİK 88" (kararlarda "İİK'nın 88. maddesi",
 * "İcra ve İflas Kanunu m.88" gibi çeşitli yazımlar geçebilir; kesin ifade yerine
 * kanun kısaltması + numara AND'i daha yüksek recall sağlar).
 */
export function maddeAtfindanTerim(atfi: MaddeAtfi): string | null {
  if (!atfi.kanun) return null;
  return `${atfi.kanun} ${atfi.madde}`;
}

/** Sorguda geçen kavramın bilinen tek-maddelik karşılığı varsa döner (ek varyant için). */
export function kavramdanMaddeTerimi(qLower: string): string | null {
  for (const grup of KAVRAM_GRUPLARI) {
    const hepsi = [grup.ana, ...grup.esanlamlar];
    if (hepsi.some((t) => qLower.includes(t))) {
      const eslesme = kavramMaddeBul(grup.ana);
      if (eslesme) return `${eslesme.kanun} ${eslesme.madde}`;
    }
  }
  return null;
}

export { kavramGrubuBul };
