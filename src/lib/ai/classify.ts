export type QueryType = "basit_soru" | "emsal_arastirma" | "belge_analizi" | "dilekce_uretimi" | "savunma_sozlesme" | "medya_analizi";

export const CREDIT_COSTS: Record<QueryType, number> = {
  basit_soru: 1,
  emsal_arastirma: 3,
  belge_analizi: 5,
  dilekce_uretimi: 8,
  savunma_sozlesme: 10,
  medya_analizi: 7,
};

export const QUERY_TYPE_LABELS: Record<QueryType, string> = {
  basit_soru: "Hukuki Soru",
  emsal_arastirma: "Emsal Araştırma",
  belge_analizi: "Belge Analizi",
  dilekce_uretimi: "Dilekçe Üretimi",
  savunma_sozlesme: "Savunma / Sözleşme",
  medya_analizi: "Medya Analizi",
};

const EMSAL_KEYWORDS = ["içtihat", "emsal", "yargıtay", "danıştay", "karar", "aym", "bam", "istinaf", "esas", "daire"];
const DILEKCE_KEYWORDS = ["dilekçe", "yaz", "hazırla", "oluştur", "taslak", "ihtarname", "şikayet", "başvuru", "itiraz"];
const SAVUNMA_KEYWORDS = ["savunma", "sözleşme", "kontrat", "müdafaa", "cevap dilekçesi"];
const BELGE_KEYWORDS = ["analiz et", "incele", "değerlendir", "belge", "sözleşmemi", "kararı anlat"];

export function classifyQuery(text: string): QueryType {
  const lower = text.toLowerCase();

  if (SAVUNMA_KEYWORDS.some((k) => lower.includes(k))) return "savunma_sozlesme";
  if (DILEKCE_KEYWORDS.some((k) => lower.includes(k))) return "dilekce_uretimi";
  if (EMSAL_KEYWORDS.some((k) => lower.includes(k))) return "emsal_arastirma";
  if (BELGE_KEYWORDS.some((k) => lower.includes(k))) return "belge_analizi";

  return "basit_soru";
}
