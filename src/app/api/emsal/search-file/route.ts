import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const EMSAL_API = process.env.EMSAL_API_URL;

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "Dosya bulunamadı" }, { status: 400 });

  // Dosya metnini oku
  const text = await file.text();
  // İlk 500 karakter ile sorgu oluştur
  const extractedQuery = text.slice(0, 500).replace(/\s+/g, " ").trim();

  if (!EMSAL_API) {
    return Response.json({ results: [], total: 0, extractedQuery, source: "file" });
  }

  try {
    const params = new URLSearchParams({ q: extractedQuery, court: "all", page: "1" });
    const res = await fetch(`${EMSAL_API}/search?${params}`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error("API error");
    const data = await res.json() as { results: Any[]; total: number };
    return Response.json({ results: data.results, total: data.total, extractedQuery, source: "file" });
  } catch {
    return Response.json({ results: [], total: 0, extractedQuery, source: "file" });
  }
}
