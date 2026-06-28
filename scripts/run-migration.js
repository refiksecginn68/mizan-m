#!/usr/bin/env node
/**
 * Supabase migration çalıştırıcı.
 * Kullanım: node scripts/run-migration.js <dosya.sql>
 *           node scripts/run-migration.js --all   (henüz çalışmamış olanları sırayla)
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// Supabase connection string: proje ref'ten oluşturulur
// Format: postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!projectRef || !serviceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik");
  process.exit(1);
}

// Supabase REST API üzerinden SQL çalıştır (pg bağlantısı yokken fallback)
async function runSqlViaRest(sql) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  // Supabase'in exec_sql fonksiyonu yoksa direkt pg bağlantısı denenir
  // Bu script pg bağlantısını kullanır — connection string .env'e eklenmeli
  console.log("ℹ️  Bu script için .env.local'e şunu ekleyin:");
  console.log(`DATABASE_URL=postgresql://postgres.${projectRef}:[DB_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`);
  console.log("   DB_PASSWORD: Supabase Dashboard → Settings → Database → Database password");
  process.exit(0);
}

async function run() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    await runSqlViaRest();
    return;
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("✓ Veritabanına bağlanıldı");

    const args = process.argv.slice(2);

    if (args[0] === "--all") {
      const migrationsDir = path.join(__dirname, "../supabase/migrations");
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith(".sql"))
        .sort();

      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf8");
        console.log(`\n→ Çalıştırılıyor: ${file}`);
        try {
          await client.query(sql);
          console.log(`  ✓ ${file} tamamlandı`);
        } catch (e) {
          const msg = e.message || "";
          if (msg.includes("already exists")) {
            console.log(`  ⚠ ${file} — zaten mevcut (atlandı)`);
          } else {
            console.error(`  ✗ ${file} — HATA: ${msg}`);
          }
        }
      }
    } else if (args[0]) {
      const filePath = path.isAbsolute(args[0])
        ? args[0]
        : path.join(__dirname, "../supabase/migrations", args[0]);
      const sql = fs.readFileSync(filePath, "utf8");
      console.log(`→ Çalıştırılıyor: ${path.basename(filePath)}`);
      await client.query(sql);
      console.log("✓ Tamamlandı");
    } else {
      console.log("Kullanım:");
      console.log("  node scripts/run-migration.js 004_clients_uyap_fields.sql");
      console.log("  node scripts/run-migration.js --all");
    }
  } catch (e) {
    console.error("❌ Bağlantı hatası:", e.message);
  } finally {
    await client.end();
  }
}

run();
