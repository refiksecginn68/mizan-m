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

// Cohere Rerank API helper
async function cohereRerank(
  query: string,
  documents: { id: string; text: string }[],
  limit = 10
): Promise<{ id: string; score: number }[]> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey || documents.length === 0) {
    return documents.map((doc, idx) => ({ id: doc.id, score: 1 / (idx + 1) }));
  }

  try {
    const response = await fetch("https://api.cohere.com/v1/rerank", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "rerank-multilingual-v3.0",
        query,
        documents: documents.map((doc) => doc.text),
        top_n: limit,
      }),
    });

    if (!response.ok) {
      console.error("Cohere Rerank API error:", response.statusText);
      return documents.map((doc, idx) => ({ id: doc.id, score: 1 / (idx + 1) }));
    }

    const data = await response.json() as {
      results: { index: number; relevance_score: number }[];
    };

    return data.results.map((res) => ({
      id: documents[res.index].id,
      score: res.relevance_score,
    }));
  } catch (err) {
    console.error("Cohere Rerank network error:", err);
    return documents.map((doc, idx) => ({ id: doc.id, score: 1 / (idx + 1) }));
  }
}

// Reciprocal Rank Fusion (RRF)
function rrf(
  denseList: EmsalResult[],
  sparseList: EmsalResult[],
  k = 60
): { id: string; score: number }[] {
  const scores: Record<string, number> = {};

  denseList.forEach((doc, index) => {
    if (doc.id) {
      const rank = index + 1;
      scores[doc.id] = (scores[doc.id] || 0) + 1 / (k + rank);
    }
  });

  sparseList.forEach((doc, index) => {
    if (doc.id) {
      const rank = index + 1;
      scores[doc.id] = (scores[doc.id] || 0) + 1 / (k + rank);
    }
  });

  return Object.keys(scores)
    .map((id) => ({ id, score: scores[id] }))
    .sort((a, b) => b.score - a.score);
}

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

// Serbest metindeki esas/karar no'yu ayıklayıp kesin-eşleşme yoluna sokar.
// "2019/1234 E." | "esas no: 2019/1234" | "2020/5678 K." | "karar no 2020/5678"
function preprocessQuery(f: Filters): void {
  if (!f.q) return;
  let q = f.q;
  const take = (re: RegExp): string | null => {
    const m = q.match(re);
    if (!m) return null;
    q = q.replace(m[0], " ");
    return m[1];
  };
  if (!f.esas) {
    const esas =
      take(/\b(\d{4}\/\d{1,6})\s*(?:E\.|E\b|esas(?:\s*(?:no|sayılı))?)/i) ??
      take(/\besas(?:\s*no)?\s*[:.]?\s*(\d{4}\/\d{1,6})/i);
    if (esas) f.esas = esas;
  }
  if (!f.karar) {
    const karar =
      take(/\b(\d{4}\/\d{1,6})\s*(?:K\.|K\b|karar(?:\s*(?:no|sayılı))?)/i) ??
      take(/\bkarar(?:\s*no)?\s*[:.]?\s*(\d{4}\/\d{1,6})/i);
    if (karar) f.karar = karar;
  }
  f.q = q.replace(/\s{2,}/g, " ").trim();
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
// Hız koruması bedesten.ts'teki global limiter'da (istek başlangıçları ≥250ms aralıklı,
// 429'da soğuma) — burada ekstra serileştirme yapmak toplam süreyi katlıyordu.
async function enrich(results: EmsalResult[], f: Filters): Promise<EmsalResult[]> {
  // 5 denendi: Bedesten 429 soğuması tetiklenip özetler eksik kalıyor; 3 dengeli
  const CONCURRENCY = 3;
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
  }
  return out;
}

async function searchBedesten(f: Filters): Promise<{ results: EmsalResult[]; total: number } | null> {
  const courtTypes = EMSAL_COURT_TYPES[f.court] ?? EMSAL_COURT_TYPES.all;
  if (courtTypes.length === 0) return null; // Bedesten'de bulunmayan kaynak (ör. AYM) → fallback
  const birimAdi = daireToBirimAdi(f.court, f.daire);
  const sort = f.sort === "guncel" ? "yeni" : f.sort === "eski" ? "eski" : "alaka";
  const cohereKey = process.env.COHERE_API_KEY;
  const isRerankActive = !!(cohereKey && f.q);
  // Esas/karar no veya belge türü veya rerank aktifse geniş sayfa çek
  const needsWide = !!(f.esas || f.karar || f.belgeTuru || isRerankActive);
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

  // Sayfalama (geniş çekildiyse ve rerank aktif değilse)
  if (needsWide && !isRerankActive) {
    total = Math.min(total, results.length);
    results = results.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE);
  }

  // Tam metin zenginleştirme: özet + gerçek alaka skoru.
  // Yalnızca ilk 5 sonuç (rerank aktifse ilk 15 sonuç)
  const enrichLimit = isRerankActive ? 15 : 5;
  const head = await enrich(results.slice(0, enrichLimit), f);
  results = [...head, ...results.slice(enrichLimit)];

  // Rerank adımı (Cohere API ile)
  if (isRerankActive && head.length > 1) {
    const docsToRerank = head.map((r, index) => ({
      id: String(index),
      text: `${r.court} · ${r.case_number} · ${r.subject}\n${r.summary || ""}`.trim()
    }));
    const reranked = await cohereRerank(f.q, docsToRerank, enrichLimit);
    const rerankedHead: EmsalResult[] = [];
    reranked.forEach((item) => {
      const idx = parseInt(item.id, 10);
      const original = head[idx];
      rerankedHead.push({
        ...original,
        score: item.score
      });
    });
    // Herhangi bir hata/eksik durumunda listede kalanları ekle
    const seenIndices = new Set(reranked.map(item => parseInt(item.id, 10)));
    head.forEach((doc, idx) => {
      if (!seenIndices.has(idx)) {
        rerankedHead.push(doc);
      }
    });
    results = [...rerankedHead, ...results.slice(enrichLimit)];
  }

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

  if (isRerankActive) {
    total = Math.min(total, results.length);
    const start = (f.page - 1) * PAGE_SIZE;
    results = results.slice(start, start + PAGE_SIZE);
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
  const cohereKey = process.env.COHERE_API_KEY;
  const isRerankActive = !!(cohereKey && f.q);

  // Ortak filtreleme sorguları
  const courtFilter = f.court !== "all" && SOURCE_MAP[f.court] ? SOURCE_MAP[f.court] : null;
  const daireFilter = f.daire ? f.daire.match(/^\d+/)?.[0] || null : null;
  const startDateFilter = f.startDate || null;
  const endDateFilter = f.endDate || null;

  let results: EmsalResult[] = [];

  if (f.q) {
    // 1. Dense (Vector) Search & Sparse (FTS) Search in Parallel
    const [densePromise, sparsePromise] = await Promise.allSettled([
      // Dense (Vector) Arama
      (async () => {
        const embedding = await generateEmbedding(f.q, "query");
        if (!embedding) return [];

        const { data, error } = await supabase.rpc("semantic_search_case_laws", {
          query_embedding: embedding,
          court_filter: courtFilter,
          daire_filter: daireFilter,
          esas_filter: f.esas || null,
          karar_filter: f.karar || null,
          start_date_filter: startDateFilter,
          end_date_filter: endDateFilter,
          match_threshold: 0.5,
          match_count: 50
        }) as { data: EmsalResult[] | null; error: Any };

        if (error) {
          console.error("Supabase dense search error:", error);
          return [];
        }
        return data ?? [];
      })(),

      // Sparse (FTS) Arama
      (async () => {
        let query = supabase
          .from("case_laws")
          .select(cols)
          .textSearch("fts", f.q, { type: "websearch", config: "turkish" });

        if (courtFilter) query = query.eq("source", courtFilter);
        if (daireFilter) query = query.ilike("court", `%${daireFilter}.%`);
        if (f.esas) query = query.ilike("case_number", `%${f.esas}%`);
        if (f.karar) query = query.ilike("decision_number", `%${f.karar}%`);
        if (startDateFilter) query = query.gte("decision_date", startDateFilter);
        if (endDateFilter) query = query.lte("decision_date", endDateFilter);

        const { data, error } = await query.limit(50);
        if (error) {
          console.error("Supabase sparse search error:", error);
          return [];
        }
        return (data ?? []) as EmsalResult[];
      })()
    ]);

    const denseList = densePromise.status === "fulfilled" ? densePromise.value : [];
    const sparseList = sparsePromise.status === "fulfilled" ? sparsePromise.value : [];

    // 2. Reciprocal Rank Fusion (RRF) ile listeleri birleştir
    const rrfScores = rrf(denseList, sparseList, 60);

    const docMap = new Map<string, EmsalResult>();
    denseList.forEach(d => { if (d.id) docMap.set(d.id, d); });
    sparseList.forEach(d => { if (d.id) docMap.set(d.id, d); });

    results = rrfScores.map(item => {
      const doc = docMap.get(item.id)!;
      return {
        ...doc,
        score: item.score
      };
    });

    // 3. Cohere Rerank Entegrasyonu (varsa ve etkinse)
    if (isRerankActive && results.length > 0) {
      const docsToRerank = results.map(doc => ({
        id: doc.id!,
        text: `${doc.court} · ${doc.case_number} · ${doc.subject}\n${doc.summary}`.trim()
      }));
      const reranked = await cohereRerank(f.q, docsToRerank, 20); // Top 20 aday seç
      const rerankedMap = new Map<string, number>();
      reranked.forEach(item => rerankedMap.set(item.id, item.score));

      const rerankedDocs = results
        .filter(doc => rerankedMap.has(doc.id!))
        .map(doc => ({ ...doc, score: rerankedMap.get(doc.id!) }))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      const otherDocs = results.filter(doc => !rerankedMap.has(doc.id!));
      results = [...rerankedDocs, ...otherDocs];
    }
  } else {
    // Sadece metadata filtreleri varsa standart SQL sorgusu
    let query = supabase.from("case_laws").select(cols);
    if (courtFilter) query = query.eq("source", courtFilter);
    if (daireFilter) query = query.ilike("court", `%${daireFilter}.%`);
    if (f.esas) query = query.ilike("case_number", `%${f.esas}%`);
    if (f.karar) query = query.ilike("decision_number", `%${f.karar}%`);
    if (startDateFilter) query = query.gte("decision_date", startDateFilter);
    if (endDateFilter) query = query.lte("decision_date", endDateFilter);

    const { data, error } = await query.limit(50);
    if (!error && data) {
      results = data as EmsalResult[];
    }
  }

  // 4. Belge Türü & Özet Filtreleri (Post-processing)
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

  // 5. Sıralama Seçenekleri
  if (f.sort === "guncel") {
    results = [...results].sort((a, b) => (b.decision_date ?? "").localeCompare(a.decision_date ?? ""));
  } else if (f.sort === "eski") {
    results = [...results].sort((a, b) => (a.decision_date ?? "9999").localeCompare(b.decision_date ?? "9999"));
  } else if (f.sort === "daire") {
    results = [...results].sort((a, b) => (a.court ?? "").localeCompare(b.court ?? "", "tr"));
  } else if (f.sort === "alakalilik" && f.q) {
    // Alakalılık sıralamasında skoru olan (rerank veya RRF skoru) üstte gelir
    results = [...results].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  // 6. Sayfalama
  const total = results.length;
  const start = (f.page - 1) * PAGE_SIZE;
  return { results: results.slice(start, start + PAGE_SIZE), total };
}

// ── Ana handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const f = parseFilters(new URL(request.url));
    preprocessQuery(f);

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
