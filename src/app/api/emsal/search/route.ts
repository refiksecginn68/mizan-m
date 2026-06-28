import { createServiceClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const EMSAL_API = process.env.EMSAL_API_URL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q     = searchParams.get("q")?.trim() ?? "";
  const court = searchParams.get("court") ?? "all";
  const page  = parseInt(searchParams.get("page") ?? "1", 10);

  if (!q || q.length < 2) return Response.json({ results: [], total: 0, source: "none" });

  // Railway servisi yapılandırılmamışsa Supabase fallback
  if (!EMSAL_API) {
    return supabaseFallback(q);
  }

  const supabase = createServiceClient() as Any;
  const cacheKey = createHash("md5").update(`${q}|${court}|${page}`).digest("hex");

  // Cache kontrolü
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

  // Railway servisini çağır
  try {
    const params = new URLSearchParams({ q, court, page: String(page) });
    const res = await fetch(`${EMSAL_API}/search?${params}`, {
      next: { revalidate: 0 },
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) throw new Error(`Railway API ${res.status}`);

    const data = await res.json() as { results: Any[]; total: number };

    // Cache'e yaz (fire-and-forget)
    supabase.from("emsal_cache").upsert({
      query_hash: cacheKey,
      query_text: q,
      results: data.results,
      total: data.total,
      created_at: new Date().toISOString(),
    }, { onConflict: "query_hash" }).then(() => {}).catch(() => {});

    return Response.json({ results: data.results, total: data.total, source: "live" });
  } catch (err) {
    console.error("Emsal API error:", err);
    // Hata durumunda Supabase fallback
    return supabaseFallback(q);
  }
}

async function supabaseFallback(q: string) {
  const supabase = createServiceClient() as Any;
  const { data } = await supabase
    .from("case_laws")
    .select("id, court, case_number, decision_number, decision_date, subject, summary")
    .or(`subject.ilike.%${q}%,summary.ilike.%${q}%`)
    .order("decision_date", { ascending: false })
    .limit(20);

  return Response.json({ results: data ?? [], total: data?.length ?? 0, source: "db" });
}
