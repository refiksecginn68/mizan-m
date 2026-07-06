import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import {
  searchMevzuatRaw,
  MEVZUAT_TUR_MAP,
  YURURLUK_TUM_TURLER,
  type BedestenMevzuatItem,
} from "@/lib/services/bedesten";

interface MevzuatResult {
  id: string;
  mevzuatNo: string;
  mevzuatTur: string;
  adi: string;
  resmiGazeteSayisi?: string;
  resmiGazeteTarihi?: string;
  ozet?: string;
  url?: string;
}

// Demo veri — Bedesten erişilemezse son çare
const DEMO_MEVZUAT: MevzuatResult[] = [
  { id: "103054", mevzuatNo: "4857", mevzuatTur: "Kanun", adi: "İş Kanunu", resmiGazeteSayisi: "25134", resmiGazeteTarihi: "2003-06-10", ozet: "İş sözleşmesi, işçi hakları, kıdem tazminatı, iş güvencesi düzenlemeleri." },
  { id: "6098", mevzuatNo: "6098", mevzuatTur: "Kanun", adi: "Türk Borçlar Kanunu", resmiGazeteSayisi: "27836", resmiGazeteTarihi: "2011-02-04", ozet: "Borç ilişkileri, sözleşmeler, haksız fiil, sebepsiz zenginleşme." },
  { id: "6100", mevzuatNo: "6100", mevzuatTur: "Kanun", adi: "Hukuk Muhakemeleri Kanunu", resmiGazeteSayisi: "27836", resmiGazeteTarihi: "2011-02-04", ozet: "Medeni yargılama usulü, mahkeme teşkilatı, kanun yolları." },
  { id: "4721", mevzuatNo: "4721", mevzuatTur: "Kanun", adi: "Türk Medeni Kanunu", resmiGazeteSayisi: "24607", resmiGazeteTarihi: "2001-12-08", ozet: "Kişiler, aile, miras ve eşya hukuku." },
  { id: "5237", mevzuatNo: "5237", mevzuatTur: "Kanun", adi: "Türk Ceza Kanunu", resmiGazeteSayisi: "25611", resmiGazeteTarihi: "2004-10-12", ozet: "Suçlar, cezalar, yaptırım türleri ve ceza sorumluluğu." },
];

// Türkçe küçük harf (İ/I sorunu)
function trLower(s: string): string {
  return (s ?? "").replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
}

// Başlık eşleşmesine göre yeniden sıralama:
// Bedesten'in alaka sırası mevzuat ADI eşleşmesini öne almıyor (canlı testte
// "iş kanunu" araması 4857'yi 4. sıraya koyuyor). Tam ad > ad ile başlayan >
// adda geçen > diğer; eşitlikte RG tarihi yeni olan üstte (güncel temel kanun).
function rankByTitle(results: MevzuatResult[], q: string): MevzuatResult[] {
  const ql = trLower(q.trim());
  const score = (r: MevzuatResult): number => {
    const adi = trLower(r.adi);
    if (adi === ql) return 4000;
    if (adi.startsWith(ql)) return 3000 - Math.min(adi.length, 900);
    if (adi.includes(ql)) return 2000 - Math.min(adi.length, 900);
    const terms = ql.split(/\s+/).filter((t) => t.length >= 2);
    if (terms.length > 0 && terms.every((t) => adi.includes(t))) return 1000 - Math.min(adi.length, 900);
    return 0;
  };
  return [...results].sort((a, b) => {
    const d = score(b) - score(a);
    if (d !== 0) return d;
    // Eşit skorda güncel olan üstte: kanun numarası büyük = yeni
    // (RG tarihi temel kanunlarda boş gelebiliyor, numara daha güvenilir)
    const noA = parseInt(a.mevzuatNo, 10) || 0;
    const noB = parseInt(b.mevzuatNo, 10) || 0;
    if (noA !== noB) return noB - noA;
    return (b.resmiGazeteTarihi ?? "").localeCompare(a.resmiGazeteTarihi ?? "");
  });
}

function toResult(item: BedestenMevzuatItem): MevzuatResult {
  const rgTarih = item.resmiGazeteTarihi ? String(item.resmiGazeteTarihi).slice(0, 10) : undefined;
  return {
    id: item.mevzuatId,
    mevzuatNo: item.mevzuatNo != null ? String(item.mevzuatNo) : "",
    mevzuatTur: item.mevzuatTur?.description ?? item.mevzuatTur?.name ?? "Mevzuat",
    adi: item.mevzuatAdi ?? "",
    resmiGazeteSayisi: item.resmiGazeteSayisi ?? undefined,
    resmiGazeteTarihi: rgTarih,
    ozet: [
      item.mevzuatTur?.description,
      item.resmiGazeteSayisi ? `RG Sayı: ${item.resmiGazeteSayisi}` : "",
      rgTarih ? `RG Tarihi: ${rgTarih}` : "",
    ].filter(Boolean).join(" · "),
    url: item.url,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const tur = searchParams.get("tur") ?? "all";
  const yururluk = searchParams.get("yururluk") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  if (!q || q.length < 2) {
    return Response.json({ results: [], total: 0 });
  }

  const cacheKey = createHash("md5")
    .update(`mevzuat-v4|${q}|${tur}|${yururluk}|${startDate}|${endDate}|${page}`)
    .digest("hex");

  // Önbellek (24 saat)
  try {
    const supabase = createServiceClient();
    const { data: cached } = await supabase
      .from("mevzuat_cache")
      .select("results, total, created_at")
      .eq("query_hash", cacheKey)
      .single();
    if (cached) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = cached as any;
      if ((c.total ?? 0) > 0 && Date.now() - new Date(c.created_at as string).getTime() < 24 * 60 * 60 * 1000) {
        return Response.json({ results: c.results, total: c.total, source: "cache" });
      }
    }
  } catch { /* tablo yoksa devam */ }

  // Tür listesi: seçilen tür + yürürlük filtresi kombinasyonu
  let turList: string[] | undefined;
  if (yururluk === "mulga") {
    turList = ["MULGA"];
  } else if (tur !== "all" && MEVZUAT_TUR_MAP[tur]) {
    turList = MEVZUAT_TUR_MAP[tur];
  } else if (yururluk === "yururlukte") {
    turList = YURURLUK_TUM_TURLER;
  }

  // Sorgu tamamen sayısal ise mevzuat no araması olarak dene
  const isNumeric = /^\d{2,6}$/.test(q);

  try {
    let raw = null;
    if (isNumeric) {
      raw = await searchMevzuatRaw({ mevzuatNo: parseInt(q, 10), turList, pageSize: 20, pageNumber: page });
    }
    if (!raw || raw.items.length === 0) {
      // Önce kesin ifade, sonra geniş arama
      raw = await searchMevzuatRaw({ phrase: `"${q}"`, turList, pageSize: 20, pageNumber: page });
      if (!raw || raw.items.length === 0) {
        raw = await searchMevzuatRaw({ phrase: q, turList, pageSize: 20, pageNumber: page });
      }
    }

    if (raw && raw.items.length > 0) {
      let results = rankByTitle(raw.items.map(toResult), q);
      let total = raw.total;

      // Tarih aralığı post-filter (Resmî Gazete tarihi üzerinden)
      if (startDate || endDate) {
        results = results.filter((r) => {
          if (!r.resmiGazeteTarihi) return false;
          if (startDate && r.resmiGazeteTarihi < startDate) return false;
          if (endDate && r.resmiGazeteTarihi > endDate) return false;
          return true;
        });
        total = results.length;
      }

      // Önbelleğe yaz (fire-and-forget)
      if (results.length > 0) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const supabase = createServiceClient() as any;
          void supabase.from("mevzuat_cache").upsert({
            query_hash: cacheKey,
            query_text: q,
            results,
            total,
            created_at: new Date().toISOString(),
          }, { onConflict: "query_hash" }).then(() => {}, () => {});
        } catch { /* ignore */ }
      }

      return Response.json({ results, total, source: "live" });
    }
  } catch {
    // Bedesten erişilemez — demo veriye düş
  }

  // Fallback: demo veri
  const qLower = q.toLowerCase();
  let filtered = DEMO_MEVZUAT.filter(
    (m) => m.adi.toLowerCase().includes(qLower) || (m.ozet ?? "").toLowerCase().includes(qLower) || m.mevzuatNo.includes(q)
  );
  if (tur !== "all") filtered = filtered.filter((m) => m.mevzuatTur.toLowerCase() === tur.toLowerCase());
  return Response.json({ results: filtered, total: filtered.length, source: "demo" });
}
