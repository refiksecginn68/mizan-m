import { createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embed";
import { createHash } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const EMSAL_API = process.env.EMSAL_API_URL;

interface EmsalResult {
  id?: string;
  documentId?: string;
  court: string;
  case_number: string;
  decision_number?: string | null;
  decision_date?: string | null;
  subject: string;
  summary: string;
  source_url?: string;
  score?: number;
}

interface Filters {
  q: string;
  court: string;
  daire: string;
  esas: string;
  karar: string;
  startDate: string;
  endDate: string;
  belgeTuru: string;
  sort: "alakalilik" | "guncel" | "eski";
  mode: "akilli" | "kelime" | "anlam" | "dosya";
  page: number;
}

// Belge türü → metin eşleşme kalıpları (case_laws şemasında ayrı kolon yok)
const BELGE_TURU_PATTERNS: Record<string, string[]> = {
  mahkeme_karari: ["karar", "hüküm"],
  bilirkisi_raporu: ["bilirkişi"],
  dava_dilekce: ["dava dilekçe", "dilekçe"],
  dilekce: ["dilekçe"],
  durusma_tutanagi: ["duruşma tutanağı", "duruşma"],
  hukuki_yazisma: ["yazışma", "müzekkere"],
  kyok: ["kovuşturmaya yer olmadığı", "kyok", "takipsizlik"],
  savcilik_karari: ["savcılık", "cumhuriyet başsavcılığı"],
  sozlesme: ["sözleşme", "akit"],
  tedbir_karari: ["tedbir", "ihtiyati"],
  tensip_tutanagi: ["tensip"],
  iddianame: ["iddianame"],
};

// UI kaynak değeri → case_laws.source kolonu
const SOURCE_MAP: Record<string, string> = {
  yargitay: "yargitay",
  danistay: "danistay",
  anayasa: "aym",
  aym: "aym",
  bam_hukuk: "bam",
  bam_ceza: "bam",
  bolge_idare: "diger",
  ilk_derece: "diger",
};

function parseFilters(url: URL): Filters {
  const sp = url.searchParams;
  const sort = sp.get("sort") ?? "alakalilik";
  const mode = sp.get("mode") ?? "akilli";
  return {
    q: sp.get("q")?.trim() ?? "",
    court: sp.get("court") ?? "all",
    daire: sp.get("daire")?.trim() ?? "",
    esas: sp.get("esas")?.trim() ?? "",
    karar: sp.get("karar")?.trim() ?? "",
    startDate: sp.get("startDate") ?? "",
    endDate: sp.get("endDate") ?? "",
    belgeTuru: sp.get("belge_turu") ?? "",
    sort: (["alakalilik", "guncel", "eski"].includes(sort) ? sort : "alakalilik") as Filters["sort"],
    mode: (["akilli", "kelime", "anlam", "dosya"].includes(mode) ? mode : "akilli") as Filters["mode"],
    page: Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1),
  };
}

// ── Ortak son-işlem: esas/karar no, belge türü, tarih ve sıralama ─────────────

function normalizeNo(s: string): string {
  return s.replace(/\s/g, "").toLowerCase();
}

function postFilter(results: EmsalResult[], f: Filters): EmsalResult[] {
  let out = results;

  if (f.esas) {
    const needle = normalizeNo(f.esas);
    out = out.filter((r) => normalizeNo(r.case_number ?? "").includes(needle));
  }
  if (f.karar) {
    const needle = normalizeNo(f.karar);
    out = out.filter((r) => normalizeNo(r.decision_number ?? "").includes(needle));
  }
  if (f.startDate) {
    out = out.filter((r) => r.decision_date && r.decision_date >= f.startDate);
  }
  if (f.endDate) {
    out = out.filter((r) => r.decision_date && r.decision_date <= f.endDate);
  }
  if (f.belgeTuru && BELGE_TURU_PATTERNS[f.belgeTuru]) {
    const patterns = BELGE_TURU_PATTERNS[f.belgeTuru];
    out = out.filter((r) => {
      const text = `${r.subject ?? ""} ${r.summary ?? ""}`.toLowerCase();
      return patterns.some((p) => text.includes(p));
    });
  }
  if (f.daire) {
    // "13hd" → "13" + hukuk; sadece rakamları eşleştir (mahkeme adında daire no geçer)
    const num = f.daire.match(/^\d+/)?.[0];
    if (num) out = out.filter((r) => (r.court ?? "").includes(`${num}.`));
  }

  return sortResults(out, f.sort);
}

function sortResults(results: EmsalResult[], sort: Filters["sort"]): EmsalResult[] {
  if (sort === "guncel") {
    return [...results].sort((a, b) => (b.decision_date ?? "").localeCompare(a.decision_date ?? ""));
  }
  if (sort === "eski") {
    return [...results].sort((a, b) => (a.decision_date ?? "9999").localeCompare(b.decision_date ?? "9999"));
  }
  return results; // alakalılık: kaynağın verdiği sıra / skor
}

// ── Supabase (yerel veritabanı) araması ───────────────────────────────────────

async function searchSupabase(f: Filters): Promise<{ results: EmsalResult[]; total: number }> {
  const supabase = createServiceClient() as Any;
  const cols = "id, court, source, case_number, decision_number, decision_date, subject, summary";

  function applyCommon(query: Any): Any {
    if (f.court !== "all" && SOURCE_MAP[f.court]) query = query.eq("source", SOURCE_MAP[f.court]);
    if (f.esas) query = query.ilike("case_number", `%${f.esas}%`);
    if (f.karar) query = query.ilike("decision_number", `%${f.karar}%`);
    if (f.startDate) query = query.gte("decision_date", f.startDate);
    if (f.endDate) query = query.lte("decision_date", f.endDate);
    if (f.sort === "guncel") query = query.order("decision_date", { ascending: false, nullsFirst: false });
    else if (f.sort === "eski") query = query.order("decision_date", { ascending: true, nullsFirst: false });
    else query = query.order("decision_date", { ascending: false, nullsFirst: false });
    return query;
  }

  const seen = new Set<string>();
  let results: EmsalResult[] = [];

  // 1) Anlam modu: pgvector semantik arama (OpenAI key varsa)
  if (f.mode === "anlam" || f.mode === "akilli") {
    try {
      const embedding = f.q ? await generateEmbedding(f.q) : null;
      if (embedding) {
        const { data: vec } = await supabase.rpc("semantic_search", {
          query_embedding: embedding,
          match_threshold: 0.7,
          match_count: 20,
        }) as { data: Array<{ source_type: string; source_id: string; similarity: number }> | null };
        const ids = (vec ?? []).filter((v) => v.source_type === "case_law").map((v) => v.source_id);
        if (ids.length > 0) {
          const { data } = await applyCommon(supabase.from("case_laws").select(cols).in("id", ids)).limit(40);
          for (const row of (data ?? []) as EmsalResult[]) {
            const sim = (vec ?? []).find((v) => v.source_id === row.id)?.similarity;
            if (row.id && !seen.has(row.id)) {
              seen.add(row.id);
              results.push({ ...row, score: sim });
            }
          }
        }
      }
    } catch { /* semantik arama yoksa devam */ }
  }

  // 2) Kelime / akıllı: Turkish full-text search
  if (f.mode !== "anlam" || results.length === 0) {
    if (f.q) {
      // Turkish FTS (005_emsal_search.sql migration'ı ile gelen "fts" kolonu; yoksa sessizce boş döner)
      const { data: ftsData, error: ftsError } = await applyCommon(
        supabase.from("case_laws").select(cols)
          .textSearch("fts", f.q, { type: "websearch", config: "turkish" })
      ).limit(40);
      if (!ftsError) {
        for (const row of ((ftsData ?? []) as EmsalResult[])) {
          if (row.id && !seen.has(row.id)) { seen.add(row.id); results.push(row); }
        }
      }

      // ilike fallback / tamamlayıcı (kelime modunda birebir eşleşme önce gelir)
      const { data: ilikeData } = await applyCommon(
        supabase.from("case_laws").select(cols)
          .or(`subject.ilike.%${f.q}%,summary.ilike.%${f.q}%,full_text.ilike.%${f.q}%`)
      ).limit(40);
      const ilikeRows = ((ilikeData ?? []) as EmsalResult[]).filter((r) => r.id && !seen.has(r.id!));
      if (f.mode === "kelime") {
        // Kelime modu: birebir geçen sonuçlar öncelikli
        for (const row of ilikeRows) { seen.add(row.id!); }
        results = [...ilikeRows, ...results.filter((r) => {
          const text = `${r.subject} ${r.summary}`.toLowerCase();
          return !text.includes(f.q.toLowerCase());
        })];
      } else {
        for (const row of ilikeRows) { seen.add(row.id!); results.push(row); }
      }
    } else {
      // Sorgu yok, sadece filtre (esas no / tarih / mahkeme) ile listele
      const { data } = await applyCommon(supabase.from("case_laws").select(cols)).limit(40);
      for (const row of (data ?? []) as EmsalResult[]) {
        if (row.id && !seen.has(row.id)) { seen.add(row.id); results.push(row); }
      }
    }
  }

  // Belge türü filtresi (metin kalıbı)
  if (f.belgeTuru && BELGE_TURU_PATTERNS[f.belgeTuru]) {
    const patterns = BELGE_TURU_PATTERNS[f.belgeTuru];
    results = results.filter((r) => {
      const text = `${r.subject ?? ""} ${r.summary ?? ""}`.toLowerCase();
      return patterns.some((p) => text.includes(p));
    });
  }

  results = sortResults(results, f.sort);

  const PAGE_SIZE = 10;
  const total = results.length;
  const start = (f.page - 1) * PAGE_SIZE;
  return { results: results.slice(start, start + PAGE_SIZE), total };
}

// ── Ana handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const f = parseFilters(new URL(request.url));

    // Ne sorgu ne de en az bir filtre varsa boş dön
    const hasAnyFilter = !!(f.esas || f.karar || f.startDate || f.endDate || f.court !== "all" || f.belgeTuru);
    if ((!f.q || f.q.length < 2) && !hasAnyFilter) {
      return Response.json({ results: [], total: 0, source: "none" });
    }

    // Railway (Bedesten) servisi yoksa doğrudan Supabase
    if (!EMSAL_API) {
      const { results, total } = await searchSupabase(f);
      return Response.json({ results, total, source: "db" });
    }

    const supabase = createServiceClient() as Any;
    const cacheKey = createHash("md5")
      .update([f.q, f.court, f.daire, f.esas, f.karar, f.startDate, f.endDate, f.belgeTuru, f.sort, f.mode, f.page].join("|"))
      .digest("hex");

    // Önbellek (24 saat)
    const { data: cached } = await supabase
      .from("emsal_cache")
      .select("results, total, created_at")
      .eq("query_hash", cacheKey)
      .single();

    if (cached) {
      const ageMs = Date.now() - new Date(cached.created_at as string).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        return Response.json({ results: cached.results, total: cached.total, source: "cache" });
      }
    }

    try {
      const params = new URLSearchParams({
        q: f.q || f.esas || f.karar,
        court: f.court,
        page: String(f.page),
      });
      if (f.startDate) params.set("date_start", f.startDate);
      if (f.endDate) params.set("date_end", f.endDate);

      const res = await fetch(`${EMSAL_API}/search?${params}`, {
        next: { revalidate: 0 },
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) throw new Error(`Railway API ${res.status}`);

      const data = await res.json() as { results: EmsalResult[]; total: number };
      const filtered = postFilter(data.results ?? [], f);

      // Son-filtre sonuç sayısını değiştirdiyse toplamı düzelt
      const total = filtered.length < (data.results ?? []).length ? filtered.length : data.total;

      // Önbelleğe yaz (fire-and-forget)
      supabase.from("emsal_cache").upsert({
        query_hash: cacheKey,
        query_text: f.q,
        results: filtered,
        total,
        created_at: new Date().toISOString(),
      }, { onConflict: "query_hash" }).then(() => {}).catch(() => {});

      // Canlı sonuç boşsa yerel veritabanını da dene
      if (filtered.length === 0) {
        const local = await searchSupabase(f);
        if (local.results.length > 0) {
          return Response.json({ results: local.results, total: local.total, source: "db" });
        }
      }

      return Response.json({ results: filtered, total, source: "live" });
    } catch (err) {
      console.error("Emsal API error:", err);
      const { results, total } = await searchSupabase(f);
      return Response.json({ results, total, source: "db" });
    }
  } catch (err) {
    console.error("Emsal search error:", err);
    return Response.json({ results: [], total: 0, source: "error" });
  }
}
