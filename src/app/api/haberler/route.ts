import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface LegalNews {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  source_url: string | null;
  category: string;
  published_at: string;
  is_featured: boolean;
  tags: string[];
}

// 30 dk cache TTL
const CACHE_TTL_MS = 30 * 60 * 1000;

const DEMO_HABERLER: LegalNews[] = [
  {
    id: "demo-1",
    title: "Yargıtay HGK: Kıdem Tazminatında Ücret Kavramı Genişletildi",
    summary: "Hukuk Genel Kurulu, kıdem tazminatı hesaplamasında ücret kavramının kapsamını primler ve yan ödemeleri de kapsayacak şekilde genişletti.",
    source: "Yargıtay HGK",
    source_url: null,
    category: "İş Hukuku",
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    is_featured: true,
    tags: ["kıdem", "tazminat", "yargıtay"],
  },
  {
    id: "demo-2",
    title: "Resmi Gazete: Tüketici Hakem Heyeti Parasal Sınırları Güncellendi",
    summary: "2026 yılı için tüketici hakem heyetlerine başvuru üst sınırları enflasyon oranında artırıldı.",
    source: "Resmi Gazete",
    source_url: null,
    category: "Tüketici Hukuku",
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_featured: false,
    tags: ["tüketici", "hakem", "sınır"],
  },
  {
    id: "demo-3",
    title: "Anayasa Mahkemesi: Tutukluluk Süresinde Hak İhlali Kararı",
    summary: "AYM, makul süreyi aşan tutukluluk nedeniyle özgürlük ve güvenlik hakkının ihlal edildiğine hükmetti.",
    source: "Anayasa Mahkemesi",
    source_url: null,
    category: "Ceza Hukuku",
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    is_featured: true,
    tags: ["AYM", "tutukluluk", "hak ihlali"],
  },
  {
    id: "demo-4",
    title: "Adalet Bakanlığı: İdare Mahkemelerinde E-Tebligat Zorunluluğu",
    summary: "Avukatlar ve kurumlar için idare mahkemelerinde elektronik tebligat zorunlu hale getirildi.",
    source: "Adalet Bakanlığı",
    source_url: null,
    category: "Usul Hukuku",
    published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    is_featured: false,
    tags: ["e-tebligat", "idare", "usul"],
  },
  {
    id: "demo-5",
    title: "TBMM: Kira Artış Oranı Sınırlaması Bir Yıl Uzatıldı",
    summary: "Konut kira artışlarında TÜFE sınırlaması uygulaması, sosyal koşullar gerekçesiyle 12 ay daha uzatıldı.",
    source: "TBMM",
    source_url: null,
    category: "Borçlar Hukuku",
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    is_featured: false,
    tags: ["kira", "tüfe", "konut"],
  },
  {
    id: "demo-6",
    title: "Danıştay: Belediye Cezalarında Savunma Hakkı Kararı",
    summary: "Danıştay 8. Dairesi, idari para cezası öncesinde yeterli savunma süresinin tanınmamasını hak ihlali saydı.",
    source: "Danıştay 8. D.",
    source_url: null,
    category: "İdare Hukuku",
    published_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    is_featured: false,
    tags: ["danıştay", "idari ceza", "savunma"],
  },
  {
    id: "demo-7",
    title: "Yargıtay 4. HD: Sosyal Medya Paylaşımında Kişilik Hakkı İhlali",
    summary: "Divan, anonim sosyal medya hesabından yapılan paylaşımların da kişilik hakkı ihlali oluşturabileceğine hükmetti.",
    source: "Yargıtay 4. HD",
    source_url: null,
    category: "Medeni Hukuk",
    published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    is_featured: false,
    tags: ["kişilik hakkı", "sosyal medya", "tazminat"],
  },
  {
    id: "demo-8",
    title: "KVKK: Yapay Zeka Sistemlerinde Veri İşleme Kılavuzu Yayımlandı",
    summary: "Kişisel Verileri Koruma Kurumu, yapay zeka uygulamalarında kişisel veri işleme ilkelerine dair bağlayıcı kılavuz yayımladı.",
    source: "KVKK",
    source_url: null,
    category: "Veri Koruma",
    published_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    is_featured: true,
    tags: ["KVKK", "yapay zeka", "veri"],
  },
];

export async function GET(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = 12;
  const offset = (page - 1) * limit;

  const cacheKey = `haberler:${category}:${q}:${page}`;
  const serviceSupabase = createServiceClient() as Any;

  // Cache kontrolü
  try {
    const { data: cached } = await serviceSupabase
      .from("news_cache")
      .select("results, created_at")
      .eq("cache_key", cacheKey)
      .single();

    if (cached && Date.now() - new Date(cached.created_at).getTime() < CACHE_TTL_MS) {
      return Response.json(cached.results);
    }
  } catch { /* cache tablosu yoksa geç */ }

  // legal_news tablosundan çek
  let news: LegalNews[] = [];
  let total = 0;
  let fromDB = false;

  try {
    let query = serviceSupabase
      .from("legal_news")
      .select("*", { count: "exact" })
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (q) query = query.ilike("title", `%${q}%`);

    const { data, count, error } = await query;

    if (!error && data) {
      news = data as LegalNews[];
      total = count ?? 0;
      fromDB = true;
    }
  } catch { /* tablo yoksa fallback */ }

  // Fallback: demo veri
  if (!fromDB) {
    let demo = [...DEMO_HABERLER];
    if (category) demo = demo.filter((h) => h.category === category);
    if (q) demo = demo.filter((h) => h.title.toLowerCase().includes(q.toLowerCase()));
    total = demo.length;
    news = demo.slice(offset, offset + limit);
  }

  const result = { news, total, page, limit, fromDB };

  // Cache'e yaz
  try {
    await serviceSupabase.from("news_cache").upsert({
      cache_key: cacheKey,
      results: result,
      created_at: new Date().toISOString(),
    }, { onConflict: "cache_key" });
  } catch { /* cache yazılamazsa sorun değil */ }

  return Response.json(result);
}
