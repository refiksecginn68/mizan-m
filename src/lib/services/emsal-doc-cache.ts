// Emsal karar tam metni — Supabase kalıcı önbellek katmanı.
// Bellek içi cache cold start'ta uçtuğu için tekrar aramalar Bedesten'e
// gidiyordu (istek başına ≥250ms global limit). Bu katman aynı kararların
// metnini bir kez indirir, sonraki aramalarda tek toplu SELECT ile döner.

import { createServiceClient } from "@/lib/supabase/server";
import { getEmsalDocumentText } from "@/lib/services/bedesten";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/** Tek toplu sorguyla önbellekten okur; eksikleri Bedesten'den çeker ve yazar. */
export async function topluKararMetni(
  documentIds: string[],
  essential = false
): Promise<Map<string, string>> {
  const sonuc = new Map<string, string>();
  const ids = Array.from(new Set(documentIds.filter(Boolean)));
  if (ids.length === 0) return sonuc;

  const svc = createServiceClient() as Any;

  try {
    const { data } = await svc
      .from("emsal_doc_cache")
      .select("document_id, content")
      .in("document_id", ids);
    for (const row of (data ?? []) as { document_id: string; content: string }[]) {
      if (row.content) sonuc.set(row.document_id, row.content);
    }
  } catch { /* tablo yoksa Bedesten yoluna düş */ }

  const eksikler = ids.filter((id) => !sonuc.has(id));
  if (eksikler.length === 0) return sonuc;

  // Eksikler Bedesten'den — global limiter zaten istekleri 250ms aralıklar
  await Promise.allSettled(
    eksikler.map(async (id) => {
      const text = await getEmsalDocumentText(id, essential);
      if (text) sonuc.set(id, text);
    })
  );

  // Yeni inenler önbelleğe (fire-and-forget)
  const yeniSatirlar = eksikler
    .filter((id) => sonuc.has(id))
    .map((id) => ({ document_id: id, content: sonuc.get(id)! }));
  if (yeniSatirlar.length > 0) {
    svc.from("emsal_doc_cache")
      .upsert(yeniSatirlar, { onConflict: "document_id" })
      .then(() => {})
      .catch(() => {});
  }

  return sonuc;
}

/** Tek karar metni — önce kalıcı önbellek, yoksa Bedesten (+ önbelleğe yaz). */
export async function tekKararMetni(documentId: string, essential = false): Promise<string | null> {
  const map = await topluKararMetni([documentId], essential);
  return map.get(documentId) ?? null;
}

/**
 * FAZ 2 backfill'inin madde_atiflari kolonunu okur (bkz. migration 033,
 * scripts/backfill-emsal-chunks.ts). Yalnızca önbellekte satırı olan ve
 * chunked_at doldurulmuş kararlar için veri döner — Bedesten'den yeni inen
 * kararlar için boş liste (henüz backfill'den geçmediler, bu normal).
 */
export async function topluKararMaddeAtiflari(
  documentIds: string[]
): Promise<Map<string, { kanun: string; madde: string }[]>> {
  const sonuc = new Map<string, { kanun: string; madde: string }[]>();
  const ids = Array.from(new Set(documentIds.filter(Boolean)));
  if (ids.length === 0) return sonuc;

  const svc = createServiceClient() as Any;
  try {
    const { data } = await svc
      .from("emsal_doc_cache")
      .select("document_id, madde_atiflari")
      .in("document_id", ids);
    for (const row of (data ?? []) as { document_id: string; madde_atiflari: { kanun: string; madde: string }[] | null }[]) {
      if (row.madde_atiflari?.length) sonuc.set(row.document_id, row.madde_atiflari);
    }
  } catch { /* tablo/kolon yoksa boş dön */ }

  return sonuc;
}
