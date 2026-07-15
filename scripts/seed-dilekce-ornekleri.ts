// Örnek dilekçe korpusunu doldurur: statik şablonlar + (varsa) kamuya açık kaynaklar.
// Yapı-farkında chunk üretir ve Cohere ile gömer.
//
// Çalıştırma: npx tsx scripts/seed-dilekce-ornekleri.ts
//             npx tsx scripts/seed-dilekce-ornekleri.ts --yeniden   (embedding'leri yeniden üret)

import { readFileSync } from "fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

import { createClient } from "@supabase/supabase-js";
import { DILEKCE_SABLONLARI } from "../src/lib/data/dilekce-sablonlari";
import { yapiFarkindaChunk } from "../src/lib/ai/dilekce-rag";
import { generateEmbeddingBatch } from "../src/lib/ai/embed";
import { anonimlestir, kisiselVeriKalintisi } from "../src/lib/services/anonimlestir";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const yeniden = process.argv.includes("--yeniden");

interface Kayit {
  sablon_id: string | null;
  baslik: string;
  aciklama: string | null;
  kategori: string;
  dava_turu: string | null;
  dilekce_tipi: string | null;
  yetkili_mahkeme: string | null;
  kaynak: string;
  kaynak_kunye: string | null;
  icerik: string;
}

// 1) Statik özgün şablonlar
function statikSablonlar(): Kayit[] {
  return DILEKCE_SABLONLARI.map((s) => ({
    sablon_id: s.id,
    baslik: s.baslik,
    aciklama: s.aciklama,
    kategori: s.kategori,
    dava_turu: s.davaTuru,
    dilekce_tipi: s.dilekceTipi,
    yetkili_mahkeme: s.yetkiliMahkeme,
    kaynak: s.kaynak,
    kaynak_kunye: null,
    icerik: s.icerik,
  }));
}

// 2) Kamuya açık karar metinlerinden dilekçe/talep bölümleri.
//    emsal_documents tam karar metnini tutar; içindeki talep/istem bölümü
//    anonimleştirilerek korpusa eklenir. Tablo boşsa bu adım sessizce atlanır.
async function ictihatKaynakli(): Promise<Kayit[]> {
  const { data, error } = await supabase
    .from("emsal_documents")
    .select("document_id, content, source_url")
    .not("content", "is", null)
    .limit(200);

  if (error) {
    console.log(`  emsal_documents okunamadı (${error.message}) — atlanıyor`);
    return [];
  }
  if (!data?.length) {
    console.log("  emsal_documents boş — içtihat kaynaklı besleme yapılmadı");
    return [];
  }

  const kayitlar: Kayit[] = [];
  for (const d of data as { document_id: string; content: string; source_url: string | null }[]) {
    // Karar metninde talep/istem bölümünü yakala
    const m = d.content.match(
      /(?:İSTEMİN ÖZETİ|DAVA(?:\s+VE\s+TALEP)?|TALEP)\s*:?\s*([\s\S]{300,4000}?)(?=\n\s*(?:KARAR|GEREKÇE|SONUÇ|HÜKÜM)\b)/i
    );
    if (!m) continue;

    const { metin, maskeler } = anonimlestir(m[1].trim());
    const kalinti = kisiselVeriKalintisi(metin);
    if (kalinti.length) {
      console.log(`  ! ${d.document_id}: kişisel veri kalıntısı (${kalinti.join(", ")}) — atlandı`);
      continue;
    }
    console.log(`  + ${d.document_id}: maskeler=${JSON.stringify(maskeler)}`);
    kayitlar.push({
      sablon_id: null,
      baslik: `İçtihat kaynaklı talep örneği — ${d.document_id}`,
      aciklama: "Kamuya açık karar metninden anonimleştirilerek alınmış talep bölümü.",
      kategori: "Başvuru / Talep",
      dava_turu: null,
      dilekce_tipi: "Talep bölümü",
      yetkili_mahkeme: null,
      kaynak: "ictihat",
      kaynak_kunye: d.source_url ?? d.document_id,
      icerik: metin,
    });
  }
  return kayitlar;
}

async function main() {
  console.log("== Örnek dilekçe korpusu seed ==\n");

  const kayitlar = [...statikSablonlar()];
  console.log(`1) Statik özgün şablonlar: ${kayitlar.length}`);

  console.log("2) Kamuya açık içtihat kaynağı:");
  const ictihat = await ictihatKaynakli();
  kayitlar.push(...ictihat);
  console.log(`   eklenen: ${ictihat.length}`);

  // Upsert — sablon_id benzersiz; içtihat kayıtlarında null olduğu için ayrı ele alınır
  console.log(`\n3) Kayıt yazılıyor (${kayitlar.length})...`);
  const idHarita = new Map<string, string>();

  for (const k of kayitlar) {
    if (k.sablon_id) {
      const { data, error } = await supabase
        .from("dilekce_ornekleri")
        .upsert({ ...k, updated_at: new Date().toISOString() }, { onConflict: "sablon_id" })
        .select("id, sablon_id")
        .single();
      if (error) { console.error(`   HATA ${k.sablon_id}:`, error.message); continue; }
      idHarita.set(k.sablon_id, (data as { id: string }).id);
    } else {
      const { data: mevcut } = await supabase
        .from("dilekce_ornekleri").select("id").eq("baslik", k.baslik).maybeSingle();
      if (mevcut) { idHarita.set(k.baslik, (mevcut as { id: string }).id); continue; }
      const { data, error } = await supabase
        .from("dilekce_ornekleri").insert(k).select("id").single();
      if (error) { console.error(`   HATA ${k.baslik}:`, error.message); continue; }
      idHarita.set(k.baslik, (data as { id: string }).id);
    }
  }
  console.log(`   yazılan: ${idHarita.size}`);

  // 4) Yapı-farkında chunk + embedding
  console.log("\n4) Chunk + embedding...");
  let toplamChunk = 0;
  let atlanan = 0;

  for (const k of kayitlar) {
    const anahtar = k.sablon_id ?? k.baslik;
    const ornekId = idHarita.get(anahtar);
    if (!ornekId) continue;

    if (!yeniden) {
      const { count } = await supabase
        .from("dilekce_ornek_embeddings")
        .select("id", { count: "exact", head: true })
        .eq("ornek_id", ornekId);
      if (count && count > 0) { atlanan++; continue; }
    } else {
      await supabase.from("dilekce_ornek_embeddings").delete().eq("ornek_id", ornekId);
    }

    const parcalar = yapiFarkindaChunk(k.icerik);
    // Arama başlıkla da eşleşsin diye her parçaya künye önekli metin gömülür
    const gomulecek = parcalar.map(
      (p) => `${k.baslik} — ${k.dava_turu ?? ""} (${p.bolum})\n${p.metin}`
    );
    const vektorler = await generateEmbeddingBatch(gomulecek);
    if (!vektorler) {
      console.error(`   ! ${anahtar}: embedding üretilemedi (COHERE_API_KEY?)`);
      continue;
    }

    const satirlar = parcalar.map((p, i) => ({
      ornek_id: ornekId,
      bolum: p.bolum,
      content_chunk: p.metin,
      embedding: vektorler[i],
      metadata: {
        baslik: k.baslik,
        kategori: k.kategori,
        dava_turu: k.dava_turu,
        dilekce_tipi: k.dilekce_tipi,
        kaynak: k.kaynak,
      },
    }));

    const { error } = await supabase.from("dilekce_ornek_embeddings").insert(satirlar);
    if (error) { console.error(`   HATA ${anahtar}:`, error.message); continue; }
    toplamChunk += satirlar.length;
    process.stdout.write(".");
  }

  console.log(`\n   yeni chunk: ${toplamChunk} | zaten gömülü (atlanan): ${atlanan}`);

  const { count: ornekSayisi } = await supabase
    .from("dilekce_ornekleri").select("id", { count: "exact", head: true });
  const { count: embSayisi } = await supabase
    .from("dilekce_ornek_embeddings").select("id", { count: "exact", head: true });

  console.log(`\n== Bitti: ${ornekSayisi} örnek, ${embSayisi} embedding ==`);
}

main().catch((e) => { console.error(e); process.exit(1); });
