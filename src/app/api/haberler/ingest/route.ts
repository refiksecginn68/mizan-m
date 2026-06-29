import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface IngestPayload {
  title: string;
  summary?: string;
  source: string;
  source_url?: string;
  category: string;
  published_at?: string;
  is_featured?: boolean;
  tags?: string[];
}

// n8n bu endpoint'i çağırır: POST /api/haberler/ingest
// Authorization: Bearer <HABERLER_INGEST_KEY>
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  const expected = process.env.HABERLER_INGEST_KEY;

  if (!expected || token !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: IngestPayload | IngestPayload[];
  try {
    body = await request.json() as IngestPayload | IngestPayload[];
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [body];
  const validated = items.filter((item) => item.title?.trim() && item.source?.trim() && item.category?.trim());

  if (validated.length === 0) {
    return Response.json({ error: "En az bir geçerli haber gerekli (title, source, category)" }, { status: 400 });
  }

  const rows = validated.map((item) => ({
    title: item.title.trim(),
    summary: item.summary?.trim() ?? null,
    source: item.source.trim(),
    source_url: item.source_url?.trim() ?? null,
    category: item.category.trim(),
    published_at: item.published_at ?? new Date().toISOString(),
    is_featured: item.is_featured ?? false,
    tags: item.tags ?? [],
  }));

  const serviceSupabase = createServiceClient() as Any;

  const { data, error } = await serviceSupabase
    .from("legal_news")
    .insert(rows)
    .select("id");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Cache'i temizle (yeni haber gelince eski cache geçersiz)
  try {
    await serviceSupabase
      .from("news_cache")
      .delete()
      .like("cache_key", "haberler:%");
  } catch { /* önemli değil */ }

  return Response.json({
    ok: true,
    inserted: (data as Any[]).length,
    ids: (data as Any[]).map((r: Any) => r.id),
  }, { status: 201 });
}
