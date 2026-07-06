// UETS aktarım endpoint testi — geçici avukat + HMAC eklenti tokenıyla gerçek istek.
// Çalıştır: npx tsx scripts/test-uets.ts  (dev sunucu açık olmalı)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const BASE = "http://localhost:3000";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { createExtensionToken } = await import("../src/lib/extension-token");

  // Geçici avukat
  const EMAIL = "uets-test@mizanim-e2e.local";
  let userId: string;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email: EMAIL, password: "Test-Uets-2026!", email_confirm: true });
  if (cErr) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list!.users.find((u) => u.email === EMAIL)!.id;
  } else userId = created.user!.id;
  await admin.from("profiles").update({ full_name: "UETS Test Avukat", user_type: "avukat" }).eq("id", userId);

  // Esas no eşleşmesi için dosya
  const { data: kase } = await admin.from("cases")
    .insert({ lawyer_id: userId, title: "UETS Eşleşme Davası", case_number: "2025/4321", status: "aktif" }).select().single();

  const token = createExtensionToken(userId);
  console.log("1) Token üretildi:", token.slice(0, 20) + "…");

  // Eklentinin UETS sayfasından okuyacağı örnek veri
  const tebligatlar = [
    { barkod: "12345678901234", gonderen: "İstanbul 5. Asliye Hukuk Mahkemesi", konu: "Duruşma günü tebliği — 2025/4321 E. sayılı dosya", tebligTarihi: "2026-07-01", esasNo: "2025/4321", okundu: false },
    { barkod: "98765432109876", gonderen: "Ankara Vergi Dairesi Müdürlüğü", konu: "Ödeme emri tebliği", tebligTarihi: "2026-06-28", okundu: true },
  ];

  const res = await fetch(`${BASE}/api/extension/tebligat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tebligatlar }),
  });
  const data = await res.json();
  console.log(`2) POST /api/extension/tebligat → HTTP ${res.status} |`, JSON.stringify(data));

  // Aynı veriyi tekrar gönder — tekilleştirme testi
  const res2 = await fetch(`${BASE}/api/extension/tebligat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tebligatlar }),
  });
  const data2 = await res2.json();
  console.log(`3) Tekrar POST (dedupe) → HTTP ${res2.status} |`, JSON.stringify(data2));

  // DB doğrulaması: kayıtlar + dosya eşleşmesi
  const { data: rows } = await admin.from("tebligat_records")
    .select("sender, subject, case_id, is_processed, uets_id, notes").eq("lawyer_id", userId);
  console.log("4) DB kayıtları:", rows?.length);
  for (const r of rows ?? []) {
    console.log(`   - ${r.sender} | ${r.subject.slice(0, 50)} | barkod: ${r.uets_id} | dosya eşleşti: ${r.case_id === kase!.id ? "✓" : r.case_id ? "?" : "—"} | işlendi: ${r.is_processed}`);
  }
  const ok = rows?.length === 2 && data.eklendi === 2 && data2.guncellendi === 2 &&
    rows.some((r) => r.case_id === kase!.id);
  console.log(`SONUÇ: ${ok ? "✓ TÜMÜ DOĞRU (2 eklendi, tekrar=2 güncellendi, esas no→dosya eşleşti)" : "✗ UYUŞMAZLIK"}`);

  // Temizlik
  await admin.from("tebligat_records").delete().eq("lawyer_id", userId);
  await admin.from("cases").delete().eq("lawyer_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
  console.log("5) Temizlik tamam");
}

main().catch((e) => { console.error("TEST HATASI:", e); process.exit(1); });
