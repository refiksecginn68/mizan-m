// Örnek dilekçe RAG katmanı.
//
// İçtihat/mevzuat RAG'inden (src/lib/ai/rag.ts) AYRIDIR ve farklı bir işi vardır:
//   - Örnek dilekçe  → ÜSLUP ve YAPI kaynağı ("nasıl yazılır")
//   - İçtihat/mevzuat → HUKUKİ DAYANAK kaynağı ("neye dayanır")
// İkisi birlikte kullanılabilir; dilekçe üretimi ikisini de çeker.

import { createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embed";

export type Bolum =
  | "makam" | "taraflar" | "konu" | "aciklamalar"
  | "hukuki_nedenler" | "deliller" | "sonuc_istem" | "diger";

export interface OrnekChunk {
  ornekId: string;
  sablonId: string | null;
  baslik: string;
  kategori: string;
  davaTuru: string | null;
  dilekceTipi: string | null;
  yetkiliMahkeme: string | null;
  kaynak: string;
  bolum: string;
  metin: string;
  benzerlik: number;
}

// Dilekçe bölüm başlıklarını tanıyan desenler — chunk sınırları buradan çıkar
const BOLUM_DESENLERI: { bolum: Bolum; desen: RegExp }[] = [
  { bolum: "aciklamalar", desen: /^\s*(AÇIKLAMALAR|İTİRAZLARIMIZ|İSTİNAF NEDENLERİ|TEMYİZ NEDENLERİ|OLAYLAR|SAVUNMALARIMIZ)\s*:?\s*$/i },
  { bolum: "hukuki_nedenler", desen: /^\s*(HUKUKİ NEDENLER|HUKUKİ SEBEPLER|YASAL NEDENLER)\s*:/i },
  { bolum: "deliller", desen: /^\s*(HUKUKİ DELİLLER|DELİLLER|DELİLLERİMİZ)\s*:/i },
  { bolum: "sonuc_istem", desen: /^\s*(SONUÇ VE İSTEM|SONUÇ VE TALEP|NETİCE-İ TALEP|SONUÇ)\s*:/i },
  { bolum: "konu", desen: /^\s*KONU\s*:/i },
  { bolum: "taraflar", desen: /^\s*(DAVACI|DAVALI|İTİRAZ EDEN|ALACAKLI|BORÇLU|ŞÜPHELİ|SANIK|MÜŞTEKİ|KEŞİDECİ|İSTİNAF EDEN)\s*:/i },
];

/**
 * Dilekçeyi bölümlerine göre parçalar. Düz sabit-uzunluk chunk yerine yapı-farkında
 * bölme: her parça dilekçenin hangi işlevsel bölümü olduğunu bilir, böylece
 * "sonuç ve istem nasıl yazılır" gibi bölüm hedefli arama mümkün olur.
 */
export function yapiFarkindaChunk(icerik: string): { bolum: Bolum; metin: string }[] {
  const satirlar = icerik.replace(/\r\n/g, "\n").split("\n");
  const parcalar: { bolum: Bolum; metin: string }[] = [];

  let aktif: Bolum = "makam";
  let tampon: string[] = [];

  const bosalt = () => {
    const metin = tampon.join("\n").trim();
    if (metin) {
      const son = parcalar[parcalar.length - 1];
      // Aynı bölüm ardışıksa birleştir (taraflar satır satır gelir)
      if (son && son.bolum === aktif) son.metin += "\n" + metin;
      else parcalar.push({ bolum: aktif, metin });
    }
    tampon = [];
  };

  for (const satir of satirlar) {
    const eslesme = BOLUM_DESENLERI.find((b) => b.desen.test(satir));
    if (eslesme) {
      bosalt();
      aktif = eslesme.bolum;
    }
    tampon.push(satir);
  }
  bosalt();

  // Çok kısa parçaları komşusuna kat — gömme için anlamsızlar
  const birlesik: { bolum: Bolum; metin: string }[] = [];
  for (const p of parcalar) {
    const son = birlesik[birlesik.length - 1];
    if (p.metin.length < 120 && son) son.metin += "\n\n" + p.metin;
    else birlesik.push({ ...p });
  }
  return birlesik;
}

/** Örnek dilekçe korpusunda semantik arama. Cohere anahtarı yoksa full-text'e düşer. */
export async function ornekDilekceAra(
  sorgu: string,
  opts: { kategori?: string; bolum?: Bolum; limit?: number; esik?: number } = {}
): Promise<OrnekChunk[]> {
  const supabase = createServiceClient();
  const limit = opts.limit ?? 5;

  try {
    const embedding = await generateEmbedding(sorgu, "query");
    if (embedding) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("dilekce_ornek_search", {
        query_embedding: embedding,
        match_threshold: opts.esik ?? 0.6,
        match_count: limit,
        kategori_filter: opts.kategori ?? null,
        bolum_filter: opts.bolum ?? null,
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const satirlar = (data ?? []) as any[];
      if (satirlar.length) {
        return satirlar.map((r) => ({
          ornekId: r.ornek_id,
          sablonId: r.sablon_id,
          baslik: r.baslik,
          kategori: r.kategori,
          davaTuru: r.dava_turu,
          dilekceTipi: r.dilekce_tipi,
          yetkiliMahkeme: r.yetkili_mahkeme,
          kaynak: r.kaynak,
          bolum: r.bolum,
          metin: r.content_chunk,
          benzerlik: r.similarity,
        }));
      }
    }
  } catch (err) {
    console.error("ornekDilekceAra vektör hatası, full-text'e düşülüyor:", err);
  }

  // Full-text yedek (Türkçe)
  const terimler = sorgu.split(/\s+/).filter((w) => w.length > 3).slice(0, 6).join(" | ");
  if (!terimler) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from("dilekce_ornekleri")
    .select("id, sablon_id, baslik, kategori, dava_turu, dilekce_tipi, yetkili_mahkeme, kaynak, icerik")
    .textSearch("baslik", terimler, { type: "websearch", config: "turkish" })
    .limit(limit);
  if (opts.kategori) q = q.eq("kategori", opts.kategori);

  const { data } = await q;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    ornekId: r.id,
    sablonId: r.sablon_id,
    baslik: r.baslik,
    kategori: r.kategori,
    davaTuru: r.dava_turu,
    dilekceTipi: r.dilekce_tipi,
    yetkiliMahkeme: r.yetkili_mahkeme,
    kaynak: r.kaynak,
    bolum: "tam",
    metin: (r.icerik as string).slice(0, 1500),
    benzerlik: 0,
  }));
}

/** Bulunan örnekleri prompt bağlamına çevirir — üslup/yapı referansı olarak. */
export function ornekBaglamiKur(chunks: OrnekChunk[]): string {
  if (!chunks.length) return "";
  const gruplu = new Map<string, OrnekChunk[]>();
  for (const c of chunks) {
    const g = gruplu.get(c.baslik) ?? [];
    g.push(c);
    gruplu.set(c.baslik, g);
  }
  const parcalar: string[] = [];
  gruplu.forEach((cs, baslik) => {
    const ilk = cs[0];
    const kunye = [ilk.dilekceTipi, ilk.yetkiliMahkeme].filter(Boolean).join(" · ");
    parcalar.push(
      `--- ÖRNEK: ${baslik}${kunye ? ` (${kunye})` : ""} ---\n` +
        cs.map((c: OrnekChunk) => c.metin).join("\n\n")
    );
  });
  return (
    "\n\n## ÜSLUP VE YAPI REFERANSI (ÖRNEK DİLEKÇELER)\n" +
    parcalar.join("\n\n") +
    "\n\nBu örnekler yalnızca ÜSLUP ve BÖLÜM YAPISI referansıdır. İçlerindeki somut olayları, " +
    "tarafları veya tutarları KOPYALAMA — yalnızca yazım düzenini ve hukuki dili örnek al."
  );
}
