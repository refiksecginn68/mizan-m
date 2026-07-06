// Bedesten (bedesten.adalet.gov.tr) — UYAP Mevzuat ve İçtihat resmi API istemcisi.
// Emsal karar araması, karar tam metni, mevzuat araması ve mevzuat tam metni.
// Kimlik doğrulama gerektirmez; UyapMevzuat uygulama başlığı ile çağrılır.

const EMSAL_BASE = "https://bedesten.adalet.gov.tr/emsal-karar";
const MEVZUAT_BASE = "https://bedesten.adalet.gov.tr/mevzuat";

const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; Mizanim-Legal/1.0)",
  AdaletApplicationName: "UyapMevzuat",
};

// ── Ortak yardımcılar ─────────────────────────────────────────────────────────

// Global hız sınırlayıcı: Bedesten art arda hızlı isteklerde throttle edip
// istekleri reddediyor (canlı testte doğrulandı). Tüm çağrılar arasına
// en az MIN_GAP ms koyarak istek başlangıçlarını serileştirir.
const MIN_GAP_MS = 250;
let rateGate: Promise<unknown> = Promise.resolve();
let lastCallAt = 0;

// 429 sonrası global soğuma: bu süre boyunca zorunlu olmayan çağrılar (belge
// zenginleştirme) atlanır, zorunlu çağrılar (arama) soğumanın bitmesini bekler.
let blockedUntil = 0;
const COOLDOWN_MS = 20000;
export function bedestenCoolingDown(): boolean {
  return Date.now() < blockedUntil;
}
async function waitCooldown(): Promise<void> {
  const remain = blockedUntil - Date.now();
  if (remain > 0) await new Promise((r) => setTimeout(r, remain));
}
function acquireSlot(): Promise<void> {
  const prev = rateGate;
  let release!: () => void;
  rateGate = new Promise<void>((r) => { release = r; });
  return prev.then(async () => {
    const wait = lastCallAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    release();
  });
}

// Backoff'lu yeniden deneme; 429'da global soğuma başlatır.
// essential=true (arama): soğumayı bekleyip dener. essential=false (belge): soğumada atlar.
async function bedestenPost<T>(
  url: string, data: unknown, timeoutMs = 20000, attempts = 3, essential = true
): Promise<T | null> {
  const backoffs = [1500, 3500];
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (bedestenCoolingDown()) {
      if (!essential) return null;
      await waitCooldown();
    }
    await acquireSlot();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ data }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: T; metadata?: { FMTY?: string } };
        if (json.metadata?.FMTY === "SUCCESS") return json.data ?? null;
        return null; // geçerli yanıt ama boş/uygunsuz — retry anlamsız
      }
      if (res.status === 429) {
        blockedUntil = Date.now() + COOLDOWN_MS;
        console.warn(`[bedesten] HTTP 429 — ${COOLDOWN_MS / 1000}s soğuma (essential=${essential})`);
        if (!essential) return null;
        continue; // essential: soğuma sonrası tekrar dene (attempt sayılır)
      }
      console.warn(`[bedesten] HTTP ${res.status} (deneme ${attempt + 1}/${attempts})`);
    } catch (e) {
      console.warn(`[bedesten] istek hatası (deneme ${attempt + 1}/${attempts}):`, e instanceof Error ? e.message : e);
    }
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, backoffs[Math.min(attempt, backoffs.length - 1)]));
  }
  return null;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Türkçe küçük harfe çevirme (I/İ sorunu için)
function trLower(s: string): string {
  return s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
}

// Sorgudan anlamlı terimleri çıkar (2+ harfli, edat/bağlaç hariç)
const STOPWORDS = new Set(["ve", "ile", "de", "da", "ki", "bu", "şu", "bir", "için", "gibi", "olan", "dair", "hakkında"]);
export function extractTerms(q: string): string[] {
  return trLower(q)
    .split(/[^a-zçğıöşü0-9/]+/i)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

// ── Emsal arama ───────────────────────────────────────────────────────────────

export interface BedestenEmsalItem {
  documentId: string;
  itemType?: { name?: string; description?: string };
  birimAdi?: string | null;
  esasNo?: string | null;
  kararNo?: string | null;
  kararTarihi?: string | null;
}

export interface EmsalSearchParams {
  phrase: string;
  courtTypes: string[];         // YARGITAYKARARI | DANISTAYKARAR | ...
  birimAdi?: string;            // "9. Hukuk Dairesi" gibi
  dateStart?: string;           // YYYY-MM-DD
  dateEnd?: string;
  sort?: "alaka" | "yeni" | "eski";
  pageSize?: number;
  pageNumber?: number;
}

// Bedesten /getItemTypes ile doğrulanan geçerli tipler:
// YARGITAYKARARI, DANISTAYKARAR, YERELHUKUK, ISTINAFHUKUK, KYB
export const EMSAL_COURT_TYPES: Record<string, string[]> = {
  yargitay: ["YARGITAYKARARI"],
  danistay: ["DANISTAYKARAR"],
  anayasa: [], // AYM kararları Bedesten'de yok — yerel DB fallback kullanılır
  bam_hukuk: ["ISTINAFHUKUK"],
  bam_ceza: ["ISTINAFHUKUK", "KYB"],
  bolge_idare: ["DANISTAYKARAR"],
  ilk_derece: ["YERELHUKUK"],
  all: ["YARGITAYKARARI", "DANISTAYKARAR", "YERELHUKUK", "ISTINAFHUKUK", "KYB"],
};

// UI daire kodu → Bedesten birimAdi
export function daireToBirimAdi(court: string, daire: string): string | undefined {
  if (!daire) return undefined;
  // Tam ad girilmişse (ör. "9. Hukuk Dairesi", "Hukuk Genel Kurulu") olduğu gibi kullan
  if (/daire|kurul/i.test(daire)) return daire.trim();
  if (daire === "hukuk_gk") return "Hukuk Genel Kurulu";
  if (daire === "ceza_gk") return "Ceza Genel Kurulu";
  if (daire === "idgk") return "İdari Dava Daireleri Kurulu";
  if (daire === "vdgk") return "Vergi Dava Daireleri Kurulu";
  const m = daire.match(/^(\d+)(hd|cd|d)?$/);
  if (!m) return undefined;
  const n = m[1];
  const suffix = m[2];
  if (suffix === "hd") return `${n}. Hukuk Dairesi`;
  if (suffix === "cd") return `${n}. Ceza Dairesi`;
  if (suffix === "d") return `${n}. Daire`;
  // BAM daireleri: mahkeme türüne göre
  if (court === "bam_ceza") return `${n}. Ceza Dairesi`;
  if (court === "bam_hukuk") return `${n}. Hukuk Dairesi`;
  return `${n}. Daire`;
}

export async function searchEmsalRaw(p: EmsalSearchParams): Promise<{ items: BedestenEmsalItem[]; total: number } | null> {
  const payload: Record<string, unknown> = {
    pageSize: p.pageSize ?? 10,
    pageNumber: p.pageNumber ?? 1,
    itemTypeList: p.courtTypes,
    phrase: p.phrase,
  };
  if (p.birimAdi) payload.birimAdi = p.birimAdi;
  if (p.dateStart) payload.kararTarihiStart = `${p.dateStart}T00:00:00.000Z`;
  if (p.dateEnd) payload.kararTarihiEnd = `${p.dateEnd}T23:59:59.000Z`;
  if (p.sort === "yeni") { payload.sortFields = ["KARAR_TARIHI"]; payload.sortDirection = "DESC"; }
  if (p.sort === "eski") { payload.sortFields = ["KARAR_TARIHI"]; payload.sortDirection = "ASC"; }

  const data = await bedestenPost<{ emsalKararList?: BedestenEmsalItem[]; total?: number }>(
    `${EMSAL_BASE}/searchDocuments`, payload
  );
  if (!data) return null;
  return { items: data.emsalKararList ?? [], total: data.total ?? 0 };
}

// Karar tam metni (base64 HTML → düz metin) — bellek içi önbellekli
const docTextCache = new Map<string, string>();
const DOC_CACHE_MAX = 500;

export async function getEmsalDocumentText(documentId: string, essential = false): Promise<string | null> {
  const cached = docTextCache.get(documentId);
  if (cached) return cached;
  // Zenginleştirme amaçlı çağrılar (essential=false) 429 soğumasında atlanır
  const data = await bedestenPost<{ content?: string; mimeType?: string }>(
    `${EMSAL_BASE}/getDocumentContent`, { documentId }, 15000, essential ? 3 : 1, essential
  );
  if (!data?.content) return null;
  try {
    const html = Buffer.from(data.content, "base64").toString("utf8");
    const text = htmlToText(html);
    if (docTextCache.size >= DOC_CACHE_MAX) {
      const first = docTextCache.keys().next().value;
      if (first) docTextCache.delete(first);
    }
    docTextCache.set(documentId, text);
    return text;
  } catch {
    return null;
  }
}

// Sorgu terimlerine göre gerçek alaka skoru (0..1) ve terim çevresinden özet üret
export function scoreAndSnippet(text: string, query: string): { score: number; snippet: string } {
  const clean = text.replace(/\s+/g, " ");
  if (!query.trim()) return { score: 0, snippet: clean.slice(0, 300) };
  const lowText = trLower(clean);
  const terms = extractTerms(query);
  if (terms.length === 0) return { score: 0, snippet: clean.slice(0, 300) };

  let matched = 0;
  let firstIdx = -1;
  for (const t of terms) {
    const i = lowText.indexOf(t);
    if (i !== -1) {
      matched++;
      if (firstIdx === -1 || i < firstIdx) firstIdx = i;
    }
  }
  // Kesin ifade bonusu
  const phraseIdx = lowText.indexOf(trLower(query.trim()));
  let score = matched / terms.length;
  if (phraseIdx !== -1) { score = Math.min(1, score + 0.25); firstIdx = phraseIdx; }

  // Snippet: ilk eşleşmenin çevresi
  let snippet: string;
  if (firstIdx === -1) {
    snippet = clean.slice(0, 300);
  } else {
    const start = Math.max(0, firstIdx - 100);
    snippet = (start > 0 ? "…" : "") + clean.slice(start, start + 320).trim() + "…";
  }
  return { score: Math.round(score * 100) / 100, snippet };
}

// ── Mevzuat arama ─────────────────────────────────────────────────────────────

export interface BedestenMevzuatItem {
  mevzuatId: string;
  mevzuatNo?: number | null;
  mevzuatAdi?: string;
  mevzuatTur?: { id?: number; name?: string; description?: string };
  resmiGazeteTarihi?: string | null;
  resmiGazeteSayisi?: string | null;
  url?: string;
}

// UI tür değeri → Bedesten mevzuatTur adları (bedesten /mevzuatTypes listesinden doğrulandı)
export const MEVZUAT_TUR_MAP: Record<string, string[]> = {
  kanun: ["KANUN"],
  yonetmelik: ["YONETMELIK", "CB_YONETMELIK", "KKY", "UY"],
  khk: ["KHK"],
  teblig: ["TEBLIGLER"],
  cbkararname: ["CB_KARARNAME"],
  cbkarar: ["CB_KARAR"],
  genelge: ["CB_GENELGE"],
  tuzuk: ["TUZUK"],
};

// Yürürlükteki mevzuat türleri (MULGA hariç tümü)
export const YURURLUK_TUM_TURLER = [
  "KANUN", "CB_KARARNAME", "YONETMELIK", "CB_YONETMELIK", "CB_KARAR",
  "CB_GENELGE", "KHK", "TUZUK", "KKY", "UY", "TEBLIGLER",
];

export async function searchMevzuatRaw(opts: {
  phrase?: string;
  mevzuatNo?: number;
  turList?: string[];
  pageSize?: number;
  pageNumber?: number;
}): Promise<{ items: BedestenMevzuatItem[]; total: number } | null> {
  const payload: Record<string, unknown> = {
    pageSize: opts.pageSize ?? 20,
    pageNumber: opts.pageNumber ?? 1,
  };
  if (opts.phrase) payload.phrase = opts.phrase;
  if (opts.mevzuatNo) payload.mevzuatNo = opts.mevzuatNo;
  if (opts.turList && opts.turList.length > 0) payload.mevzuatTurList = opts.turList;

  const data = await bedestenPost<{ mevzuatList?: BedestenMevzuatItem[]; total?: number }>(
    `${MEVZUAT_BASE}/searchDocuments`, payload
  );
  if (!data) return null;
  return { items: data.mevzuatList ?? [], total: data.total ?? 0 };
}

// Mevzuat tam metni (base64 HTML → düz metin)
export async function getMevzuatText(mevzuatId: string): Promise<string | null> {
  const data = await bedestenPost<{ content?: string }>(
    `${MEVZUAT_BASE}/getDocumentContent`, { id: mevzuatId, documentType: "MEVZUAT" }, 25000
  );
  if (!data?.content) return null;
  try {
    const html = Buffer.from(data.content, "base64").toString("utf8");
    return htmlToText(html);
  } catch {
    return null;
  }
}

export interface MevzuatMadde {
  maddeId: string;
  maddeNo?: number;
  title?: string;
  maddeBaslik?: string;
  children?: MevzuatMadde[];
}

export async function getMevzuatMaddeTree(mevzuatId: string): Promise<MevzuatMadde[] | null> {
  const data = await bedestenPost<{ children?: MevzuatMadde[] }>(
    `${MEVZUAT_BASE}/mevzuatMaddeTree`, { mevzuatId }, 15000
  );
  return data?.children ?? null;
}

export async function getMevzuatMaddeText(maddeId: string): Promise<string | null> {
  const data = await bedestenPost<{ content?: string }>(
    `${MEVZUAT_BASE}/getDocumentContent`, { id: maddeId, documentType: "MADDE" }, 15000
  );
  if (!data?.content) return null;
  try {
    return htmlToText(Buffer.from(data.content, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

// Ağaçta madde numarasına göre düz arama
export function findMaddeByNo(tree: MevzuatMadde[], no: number): MevzuatMadde | null {
  for (const node of tree) {
    if (node.maddeNo === no) return node;
    if (node.children && node.children.length > 0) {
      const found = findMaddeByNo(node.children, no);
      if (found) return found;
    }
  }
  return null;
}
