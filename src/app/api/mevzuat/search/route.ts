import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

// Demo mevzuat verisi — API erişilemez olduğunda kullanılır
const DEMO_MEVZUAT = [
  {
    id: "4857",
    mevzuatNo: "4857",
    mevzuatTur: "Kanun",
    adi: "İş Kanunu",
    resmiGazeteSayisi: "25134",
    resmiGazeteTarihi: "2003-06-10",
    madde_sayisi: 112,
    ozet: "İş sözleşmesi, işçi hakları, kıdem tazminatı, iş güvencesi ve toplu iş hukuku düzenlemeleri.",
  },
  {
    id: "6098",
    mevzuatNo: "6098",
    mevzuatTur: "Kanun",
    adi: "Türk Borçlar Kanunu",
    resmiGazeteSayisi: "27836",
    resmiGazeteTarihi: "2011-02-04",
    madde_sayisi: 649,
    ozet: "Borç ilişkileri, sözleşmeler, haksız fiil, sebepsiz zenginleşme ve borçların sona ermesi.",
  },
  {
    id: "6100",
    mevzuatNo: "6100",
    mevzuatTur: "Kanun",
    adi: "Hukuk Muhakemeleri Kanunu",
    resmiGazeteSayisi: "27836",
    resmiGazeteTarihi: "2011-02-04",
    madde_sayisi: 476,
    ozet: "Medeni yargılama usulü, mahkeme teşkilatı, yargılama ilkeleri ve kanun yolları.",
  },
  {
    id: "4721",
    mevzuatNo: "4721",
    mevzuatTur: "Kanun",
    adi: "Türk Medeni Kanunu",
    resmiGazeteSayisi: "24607",
    resmiGazeteTarihi: "2001-12-08",
    madde_sayisi: 1030,
    ozet: "Kişiler hukuku, aile hukuku, miras hukuku ve eşya hukuku.",
  },
  {
    id: "2709",
    mevzuatNo: "2709",
    mevzuatTur: "Kanun",
    adi: "Türkiye Cumhuriyeti Anayasası",
    resmiGazeteSayisi: "17844",
    resmiGazeteTarihi: "1982-11-09",
    madde_sayisi: 177,
    ozet: "Temel haklar, devlet organları, yasama, yürütme ve yargı yapılanması.",
  },
  {
    id: "5237",
    mevzuatNo: "5237",
    mevzuatTur: "Kanun",
    adi: "Türk Ceza Kanunu",
    resmiGazeteSayisi: "25611",
    resmiGazeteTarihi: "2004-10-12",
    madde_sayisi: 345,
    ozet: "Suçlar, cezalar, yaptırım türleri ve ceza sorumluluğu.",
  },
  {
    id: "2577",
    mevzuatNo: "2577",
    mevzuatTur: "Kanun",
    adi: "İdari Yargılama Usulü Kanunu",
    resmiGazeteSayisi: "17580",
    resmiGazeteTarihi: "1982-01-20",
    madde_sayisi: 65,
    ozet: "İdare mahkemelerinde yargılama usulü, iptal ve tam yargı davaları.",
  },
  {
    id: "6362",
    mevzuatNo: "6362",
    mevzuatTur: "Kanun",
    adi: "Sermaye Piyasası Kanunu",
    resmiGazeteSayisi: "28513",
    resmiGazeteTarihi: "2012-12-30",
    madde_sayisi: 143,
    ozet: "Sermaye piyasası araçları, halka arz, borsa ve SPK düzenlemeleri.",
  },
  {
    id: "5510",
    mevzuatNo: "5510",
    mevzuatTur: "Kanun",
    adi: "Sosyal Sigortalar ve GSS Kanunu",
    resmiGazeteSayisi: "26200",
    resmiGazeteTarihi: "2006-06-16",
    madde_sayisi: 108,
    ozet: "Sosyal güvenlik, emeklilik, iş kazası ve hastalık sigortası.",
  },
  {
    id: "6698",
    mevzuatNo: "6698",
    mevzuatTur: "Kanun",
    adi: "Kişisel Verilerin Korunması Kanunu",
    resmiGazeteSayisi: "29677",
    resmiGazeteTarihi: "2016-04-07",
    madde_sayisi: 32,
    ozet: "Kişisel veri işleme, KVKK, GDPR uyumu, veri sorumlusu yükümlülükleri.",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  // Kanun, yonetmelik, khk, teblig veya all
  const tur = searchParams.get("tur") ?? "all";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  if (!q || q.length < 2) {
    return Response.json({ results: [], total: 0 });
  }

  // Cache key oluştur
  const cacheKey = createHash("md5")
    .update(`mevzuat|${q}|${tur}|${page}`)
    .digest("hex");

  // Supabase cache kontrolü (mevzuat_cache tablosu varsa)
  try {
    const supabase = createServiceClient();
    const { data: cached } = await supabase
      .from("mevzuat_cache")
      .select("results, total, created_at")
      .eq("query_hash", cacheKey)
      .single();

    if (cached) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cachedAny = cached as any;
      const ageMs = Date.now() - new Date(cachedAny.created_at as string).getTime();
      // 24 saat geçerli
      if (ageMs < 24 * 60 * 60 * 1000) {
        return Response.json({ results: cachedAny.results, total: cachedAny.total, source: "cache" });
      }
    }
  } catch {
    // Tablo yoksa veya bağlantı hatası — devam et
  }

  // Gerçek mevzuat arama — mevzuat.gov.tr proxy
  try {
    const apiUrl = `https://mevzuat.gov.tr/MevzuatMetin/searchV3.aspx?keyword=${encodeURIComponent(q)}&mevzuatTur=${tur !== "all" ? tur : ""}&pageSize=10&pageIndex=${page}`;
    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = (await res.json()) as { results?: unknown[]; total?: number };
      return Response.json({
        results: data.results ?? [],
        total: data.total ?? 0,
        source: "live",
      });
    }
  } catch {
    // API erişilemez — demo veriye düş
  }

  // Fallback: demo mevzuat verisi
  const qLower = q.toLowerCase();
  let filtered = DEMO_MEVZUAT.filter(
    (m) =>
      m.adi.toLowerCase().includes(qLower) ||
      m.ozet.toLowerCase().includes(qLower) ||
      m.mevzuatNo.includes(q)
  );
  if (tur !== "all") {
    filtered = filtered.filter(
      (m) => m.mevzuatTur.toLowerCase() === tur.toLowerCase()
    );
  }

  return Response.json({
    results: filtered,
    total: filtered.length,
    source: "demo",
  });
}
