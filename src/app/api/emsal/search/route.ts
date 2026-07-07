import { createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embed";
import { createHash } from "crypto";
import {
  searchEmsalRaw,
  getEmsalDocumentText,
  scoreAndSnippet,
  extractTerms,
  daireToBirimAdi,
  EMSAL_COURT_TYPES,
  type BedestenEmsalItem,
} from "@/lib/services/bedesten";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const PAGE_SIZE = 10;

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
  ozet: "" | "ozetli" | "ozetsiz";
  sort: "alakalilik" | "guncel" | "eski" | "daire";
  mode: "akilli" | "kelime" | "anlam" | "dosya";
  page: number;
}

// Belge türü → metin eşleşme kalıpları (karar tam metni üzerinde aranır)
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
  const ozet = sp.get("ozet") ?? "";
  return {
    q: sp.get("q")?.trim() ?? "",
    court: sp.get("court") ?? "all",
    daire: sp.get("daire")?.trim() ?? "",
    esas: sp.get("esas")?.trim() ?? "",
    karar: sp.get("karar")?.trim() ?? "",
    startDate: sp.get("startDate") ?? "",
    endDate: sp.get("endDate") ?? "",
    belgeTuru: sp.get("belge_turu") ?? "",
    ozet: (["ozetli", "ozetsiz"].includes(ozet) ? ozet : "") as Filters["ozet"],
    sort: (["alakalilik", "guncel", "eski", "daire"].includes(sort) ? sort : "alakalilik") as Filters["sort"],
    mode: (["akilli", "kelime", "anlam", "dosya"].includes(mode) ? mode : "akilli") as Filters["mode"],
    page: Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1),
  };
}

function normalizeNo(s: string): string {
  return s.replace(/\s/g, "").toLowerCase();
}

// ── Bedesten doğrudan arama ───────────────────────────────────────────────────

// Arama moduna göre Bedesten phrase sözdizimi üret.
// NOT: Tırnaksız çoklu kelime Bedesten'de OR gibi davranıp milyonlarca alakasız
// sonuç getiriyor (canlı probe ile doğrulandı) — bu yüzden "plain" fallback yok;
// kesin ifade → AND(+"terim") kademesi kullanılır, o da yoksa yerel fallback devreye girer.
function buildPhrases(f: Filters): string[] {
  const noTerms: string[] = [];
  if (f.esas) noTerms.push(`+"${normalizeNo(f.esas)}"`);
  if (f.karar) noTerms.push(`+"${normalizeNo(f.karar)}"`);
  const noSuffix = noTerms.length > 0 ? " " + noTerms.join(" ") : "";

  if (!f.q) {
    // Sadece esas/karar no ile arama
    return noTerms.length > 0 ? [noTerms.join(" ")] : [];
  }

  const terms = extractTerms(f.q);
  const exact = `"${f.q}"${noSuffix}`;
  const andTerms = terms.map((t) => `+"${t}"`).join(" ") + noSuffix;

  if (f.mode === "kelime") return [exact];
  if (f.mode === "anlam") return terms.length > 1 ? [andTerms, `${f.q}${noSuffix}`] : [exact];
  // akilli: önce kesin ifade, sonra terimlerin AND'i
  if (terms.length > 1) return [exact, andTerms];
  return [exact];
}

// itemType.description bazen boş gelir — name üzerinden sabit eşleme
const ITEM_TYPE_LABELS: Record<string, string> = {
  YARGITAYKARARI: "Yargıtay",
  DANISTAYKARAR: "Danıştay",
  YERELHUKUK: "", // birimAdi zaten tam mahkeme adı içerir
  ISTINAFHUKUK: "",
  KYB: "Yargıtay (KYB)",
};

// Bedesten verisinde bozuk yıllar var ("6006-09-20", "0212-05-21") — tarih
// sıralamasında en üste/alta çıkıyorlar; makul aralık dışını null say
function sanitizeDate(raw: unknown): string | null {
  if (!raw) return null;
  const d = String(raw).slice(0, 10);
  const year = parseInt(d.slice(0, 4), 10);
  const maxYear = new Date().getFullYear() + 1;
  if (!Number.isFinite(year) || year < 1920 || year > maxYear) return null;
  return d;
}

function toResult(item: BedestenEmsalItem): EmsalResult {
  const courtType =
    item.itemType?.description ?? ITEM_TYPE_LABELS[item.itemType?.name ?? ""] ?? "";
  const birim = item.birimAdi ?? "";
  // "Yargıtay Kararı" + "9. Hukuk Dairesi" → "Yargıtay 9. Hukuk Dairesi"
  const courtName = courtType.replace(/ Kararı$/i, "").trim();
  const court = birim ? `${courtName} ${birim}`.trim() : courtName || "Mahkeme";
  return {
    documentId: item.documentId,
    court,
    case_number: item.esasNo ?? "",
    decision_number: item.kararNo ?? null,
    decision_date: sanitizeDate(item.kararTarihi),
    subject: [courtName, item.esasNo ? `${item.esasNo} E.` : "", item.kararNo ? `${item.kararNo} K.` : ""]
      .filter(Boolean).join(" · ") || "Karar",
    summary: "",
    source_url: `https://mevzuat.adalet.gov.tr/ictihat/${item.documentId}`,
  };
}

// İlk sayfa sonuçlarını karar tam metniyle zenginleştir: gerçek özet + gerçek skor.
// Düşük eşzamanlılık + batch arası bekleme: Bedesten art arda çok istekte throttle ediyor.
async function enrich(results: EmsalResult[], f: Filters): Promise<EmsalResult[]> {
  const CONCURRENCY = 2;
  const out = [...results];
  for (let i = 0; i < out.length; i += CONCURRENCY) {
    const batch = out.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (r, j) => {
        if (!r.documentId) return;
        const text = await getEmsalDocumentText(r.documentId);
        if (!text) return;
        const { score, snippet } = scoreAndSnippet(text, f.q);
        out[i + j] = {
          ...r,
          summary: snippet,
          score: f.q ? score : undefined,
        };
      })
    );
    if (i + CONCURRENCY < out.length) await new Promise((res) => setTimeout(res, 120));
  }
  return out;
}

async function searchBedesten(f: Filters): Promise<{ results: EmsalResult[]; total: number } | null> {
  const courtTypes = EMSAL_COURT_TYPES[f.court] ?? EMSAL_COURT_TYPES.all;
  if (courtTypes.length === 0) return null; // Bedesten'de bulunmayan kaynak (ör. AYM) → fallback
  const birimAdi = daireToBirimAdi(f.court, f.daire);
  const sort = f.sort === "guncel" ? "yeni" : f.sort === "eski" ? "eski" : "alaka";
  // Esas/karar no veya belge türü filtresi varsa daha geniş sayfa çek, sonra süz
  const needsWide = !!(f.esas || f.karar || f.belgeTuru);
  const pageSize = needsWide ? 50 : PAGE_SIZE;

  const phrases = buildPhrases(f);
  if (phrases.length === 0) {
    // Ne sorgu ne no filtresi: tarih/mahkeme filtreli en yeni kararlar
    phrases.push("karar");
  }

  let raw: { items: BedestenEmsalItem[]; total: number } | null = null;
  for (const phrase of phrases) {
    raw = await searchEmsalRaw({
      phrase,
      courtTypes,
      birimAdi,
      dateStart: f.startDate || undefined,
      dateEnd: f.endDate || undefined,
      sort: sort as "alaka" | "yeni" | "eski",
      pageSize,
      pageNumber: needsWide ? 1 : f.page,
    });
    if (raw && raw.items.length > 0) break;
  }
  if (!raw) return null;

  let results = raw.items.map(toResult);
  let total = raw.total;

  // Esas/karar no metadata post-filter — kesin eşleşme ZORUNLU:
  // metadata eşleşmeyen sonuç göstermek alakasız sonuç yığını demek (precision > recall)
  if (f.esas || f.karar) {
    const esasN = normalizeNo(f.esas);
    const kararN = normalizeNo(f.karar);
    const exact = results.filter((r) =>
      (!esasN || normalizeNo(r.case_number).includes(esasN)) &&
      (!kararN || normalizeNo(r.decision_number ?? "").includes(kararN))
    );
    results = exact;
    total = exact.length;
    if (exact.length === 0) return { results: [], total: 0 };
  }

  // Sayfalama (geniş çekildiyse)
  if (needsWide) {
    total = Math.min(total, results.length);
    results = results.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE);
  }

  // Tam metin zenginleştirme: özet + gerçek alaka skoru.
  // Yalnızca ilk 5 sonuç: her belge ayrı istek → 10 belge hem yavaş (30sn+)
  // hem Bedesten throttle'ını tetikliyor. Kalanlar metadata ile listelenir.
  const head = await enrich(results.slice(0, 5), f);
  results = [...head, ...results.slice(5)];

  // Belge türü filtresi zenginleştirilmiş özet + konu üzerinde
  if (f.belgeTuru && BELGE_TURU_PATTERNS[f.belgeTuru]) {
    const patterns = BELGE_TURU_PATTERNS[f.belgeTuru];
    const filtered = results.filter((r) => {
      const text = `${r.subject} ${r.summary}`.toLowerCase();
      return patterns.some((p) => text.includes(p));
    });
    if (filtered.length !== results.length) { results = filtered; total = filtered.length; }
  }

  // Özet durumu filtresi: zenginleştirme sonrası özet metni olan/olmayan
  if (f.ozet) {
    const filtered = results.filter((r) => (f.ozet === "ozetli" ? !!r.summary : !r.summary));
    if (filtered.length !== results.length) { results = filtered; total = filtered.length; }
  }

  // Mahkeme/Daire sıralaması (sayfa içi)
  if (f.sort === "daire") {
    results = [...results].sort((a, b) => a.court.localeCompare(b.court, "tr"));
  }
  // Alaka modunda skoru olan üstte
  if (f.sort === "alakalilik" && f.q) {
    results = [...results].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
  // Tarih sıralamalarında sayfa içi güvence (Bedesten ASC'de null tarihleri öne koyar)
  if (f.sort === "guncel") {
    results = [...results].sort((a, b) => (b.decision_date ?? "").localeCompare(a.decision_date ?? ""));
  } else if (f.sort === "eski") {
    results = [...results].sort((a, b) => (a.decision_date ?? "9999").localeCompare(b.decision_date ?? "9999"));
  }

  return { results, total };
}

// NOT: Eski Railway scraper fallback'i kaldırıldı — sıralamasız/özetsiz alakasız
// sonuç yığını döndürüyordu ("sonuçlar alakasız" şikayetinin kök nedeni).
// Sıra artık: Bedesten (birincil) → Supabase yerel DB.

// ── Supabase (yerel veritabanı) fallback ──────────────────────────────────────

async function searchSupabase(f: Filters): Promise<{ results: EmsalResult[]; total: number }> {
  const supabase = createServiceClient() as Any;
  const cols = "id, court, source, case_number, decision_number, decision_date, subject, summary";

  function applyCommon(query: Any): Any {
    if (f.court !== "all" && SOURCE_MAP[f.court]) query = query.eq("source", SOURCE_MAP[f.court]);
    if (f.daire) {
      const num = f.daire.match(/^\d+/)?.[0];
      if (num) query = query.ilike("court", `%${num}.%`);
    }
    if (f.esas) query = query.ilike("case_number", `%${f.esas}%`);
    if (f.karar) query = query.ilike("decision_number", `%${f.karar}%`);
    if (f.startDate) query = query.gte("decision_date", f.startDate);
    if (f.endDate) query = query.lte("decision_date", f.endDate);
    if (f.sort === "eski") query = query.order("decision_date", { ascending: true, nullsFirst: false });
    else query = query.order("decision_date", { ascending: false, nullsFirst: false });
    return query;
  }

  const seen = new Set<string>();
  let results: EmsalResult[] = [];

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
            if (row.id && !seen.has(row.id)) { seen.add(row.id); results.push({ ...row, score: sim }); }
          }
        }
      }
    } catch { /* semantik arama yoksa devam */ }
  }

  if (f.mode !== "anlam" || results.length === 0) {
    if (f.q) {
      const { data: ftsData, error: ftsError } = await applyCommon(
        supabase.from("case_laws").select(cols)
          .textSearch("fts", f.q, { type: "websearch", config: "turkish" })
      ).limit(40);
      if (!ftsError) {
        for (const row of ((ftsData ?? []) as EmsalResult[])) {
          if (row.id && !seen.has(row.id)) { seen.add(row.id); results.push(row); }
        }
      }
      const { data: ilikeData } = await applyCommon(
        supabase.from("case_laws").select(cols)
          .or(`subject.ilike.%${f.q}%,summary.ilike.%${f.q}%,full_text.ilike.%${f.q}%`)
      ).limit(40);
      const ilikeRows = ((ilikeData ?? []) as EmsalResult[]).filter((r) => r.id && !seen.has(r.id!));
      for (const row of ilikeRows) { seen.add(row.id!); results.push(row); }
      if (f.mode === "kelime") {
        const ql = f.q.toLowerCase();
        const hasExact = (r: EmsalResult) => `${r.subject ?? ""} ${r.summary ?? ""}`.toLowerCase().includes(ql);
        results = [...results.filter(hasExact), ...results.filter((r) => !hasExact(r))];
      }
    } else {
      const { data } = await applyCommon(supabase.from("case_laws").select(cols)).limit(40);
      for (const row of (data ?? []) as EmsalResult[]) {
        if (row.id && !seen.has(row.id)) { seen.add(row.id); results.push(row); }
      }
    }
  }

  if (f.belgeTuru && BELGE_TURU_PATTERNS[f.belgeTuru]) {
    const patterns = BELGE_TURU_PATTERNS[f.belgeTuru];
    results = results.filter((r) => {
      const text = `${r.subject ?? ""} ${r.summary ?? ""}`.toLowerCase();
      return patterns.some((p) => text.includes(p));
    });
  }

  if (f.ozet) {
    results = results.filter((r) => (f.ozet === "ozetli" ? !!r.summary : !r.summary));
  }

  if (f.sort === "guncel") results = [...results].sort((a, b) => (b.decision_date ?? "").localeCompare(a.decision_date ?? ""));
  else if (f.sort === "eski") results = [...results].sort((a, b) => (a.decision_date ?? "9999").localeCompare(b.decision_date ?? "9999"));
  else if (f.sort === "daire") results = [...results].sort((a, b) => (a.court ?? "").localeCompare(b.court ?? "", "tr"));

  const total = results.length;
  const start = (f.page - 1) * PAGE_SIZE;
  return { results: results.slice(start, start + PAGE_SIZE), total };
}

// ── Ana handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const f = parseFilters(new URL(request.url));

    const hasAnyFilter = !!(f.esas || f.karar || f.startDate || f.endDate || f.court !== "all" || f.belgeTuru);
    if ((!f.q || f.q.length < 2) && !hasAnyFilter) {
      return Response.json({ results: [], total: 0, source: "none" });
    }

    const supabase = createServiceClient() as Any;
    // v5: önceki sürümlerin önbelleği hatalı motor çıktıları içeriyor — kullanılmaz
    const cacheKey = createHash("md5")
      .update(["v7", f.q, f.court, f.daire, f.esas, f.karar, f.startDate, f.endDate, f.belgeTuru, f.ozet, f.sort, f.mode, f.page].join("|"))
      .digest("hex");

    // Önbellek (24 saat) — boş kayıtlar kullanılmaz
    try {
      const { data: cached } = await supabase
        .from("emsal_cache")
        .select("results, total, created_at")
        .eq("query_hash", cacheKey)
        .single();
      if (cached && (cached.total ?? 0) > 0) {
        const ageMs = Date.now() - new Date(cached.created_at as string).getTime();
        if (ageMs < 24 * 60 * 60 * 1000) {
          return Response.json({ results: cached.results, total: cached.total, source: "cache" });
        }
      }
    } catch { /* önbellek yoksa devam */ }

    // 1) Bedesten doğrudan (birincil motor)
    let outcome = await searchBedesten(f);
    let source = "live";

    // 2) Supabase yerel fallback
    if (!outcome || outcome.results.length === 0) {
      const local = await searchSupabase(f);
      if (local.results.length > 0) { outcome = local; source = "db"; }
    }

    if (!outcome) return Response.json({ results: [], total: 0, source: "error" });

    // Önbelleğe yaz (fire-and-forget) — boş sonuç veya özetleri eksik (throttle'lı)
    // sonuç yazılmaz; aksi halde bozuk sayfa 24 saat servis edilir
    const enrichedEnough =
      outcome.results.length > 0 &&
      (source !== "live" || outcome.results.filter((r) => r.summary).length >= outcome.results.length / 2);
    if (enrichedEnough) {
      supabase.from("emsal_cache").upsert({
        query_hash: cacheKey,
        query_text: f.q,
        results: outcome.results,
        total: outcome.total,
        created_at: new Date().toISOString(),
      }, { onConflict: "query_hash" }).then(() => {}).catch(() => {});
    }

    return Response.json({ results: outcome.results, total: outcome.total, source });
  } catch (err) {
    console.error("Emsal search error:", err);
    return Response.json({ results: [], total: 0, source: "error" });
  }
}
