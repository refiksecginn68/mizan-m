// Dilekçe şablon korpusu — kategori dosyalarının birleştiricisi.
//
// TELİF: Tüm şablonlar SIFIRDAN ÖZGÜN yazılmıştır. Corpus.com.tr, Lexpera vb.
// ticari/telifli platformlardan hiçbir metin kopyalanmamıştır.

import { type DilekceSablonu } from "./tipler";
import { IS_HUKUKU_SABLONLARI } from "./is-hukuku";
import { AILE_SABLONLARI } from "./aile";
import { ICRA_SABLONLARI } from "./icra";
import { CEZA_SABLONLARI } from "./ceza";
import { TAZMINAT_SABLONLARI } from "./tazminat";
import { KIRA_GAYRIMENKUL_SABLONLARI } from "./kira-gayrimenkul";
import { TUKETICI_IDARI_SABLONLARI } from "./tuketici-idari";
import { SOZLESME_GENEL_SABLONLARI } from "./sozlesme-genel";

export { SABLON_KATEGORILERI, IMZA_BLOGU, IMZA_BLOGU_DAVALI } from "./tipler";
export type { DilekceSablonu, SablonKategori } from "./tipler";

export const DILEKCE_SABLONLARI: DilekceSablonu[] = [
  ...IS_HUKUKU_SABLONLARI,
  ...AILE_SABLONLARI,
  ...ICRA_SABLONLARI,
  ...CEZA_SABLONLARI,
  ...TAZMINAT_SABLONLARI,
  ...KIRA_GAYRIMENKUL_SABLONLARI,
  ...TUKETICI_IDARI_SABLONLARI,
  ...SOZLESME_GENEL_SABLONLARI,
];

export function sablonBul(id: string): DilekceSablonu | undefined {
  return DILEKCE_SABLONLARI.find((s) => s.id === id);
}
