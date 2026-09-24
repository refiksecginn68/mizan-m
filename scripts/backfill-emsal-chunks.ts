// FAZ 2 backfill: emsal_doc_cache'teki her karar için künye/yapısal chunk/madde-atfı
// çıkarımını çalıştırıp DB'ye yazar (bkz. supabase/migrations/033, memory emsal-arama-motoru-faz).
import { Client } from "pg";
import { readFileSync } from "fs";
import { karariKunyeCikar, karariBol, documentMaddeleriCikar } from "../src/lib/arama/karar-chunker";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows } = await client.query<{ document_id: string; content: string }>(
    "SELECT document_id, content FROM emsal_doc_cache WHERE chunked_at IS NULL"
  );
  console.log(`İşlenecek: ${rows.length} karar`);

  let yapisalBulunan = 0;
  let maddeliBulunan = 0;

  for (const row of rows) {
    const kunye = karariKunyeCikar(row.content);
    const bolme = karariBol(row.content);
    const maddeler = documentMaddeleriCikar(row.content);

    if (bolme.yontem !== "fallback") yapisalBulunan++;
    if (maddeler.length > 0) maddeliBulunan++;

    await client.query(
      `UPDATE emsal_doc_cache SET kunye = $1, chunks = $2, madde_atiflari = $3, chunked_at = NOW() WHERE document_id = $4`,
      [JSON.stringify(kunye), JSON.stringify(bolme.chunks), JSON.stringify(maddeler), row.document_id]
    );
  }

  console.log(`Yapısal bölüm bulunan: ${yapisalBulunan}/${rows.length} (%${(100 * yapisalBulunan / rows.length).toFixed(1)})`);
  console.log(`Madde atfı bulunan: ${maddeliBulunan}/${rows.length} (%${(100 * maddeliBulunan / rows.length).toFixed(1)})`);

  await client.end();
}

main();
