// Delil/Medya analizi E2E testi — gerçek görüntü analizi + "Analizi Dosyaya Ekle".
// Çalıştır: npx tsx scripts/test-medya.ts  (dev sunucu açık olmalı)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BASE = "http://localhost:3000";
const EMAIL = "medya-test@mizanim-e2e.local";
const PASS = "Test-Medya-2026!";
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

function cookieHeader(session: Record<string, unknown>): string {
  const ref = URL_.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? "";
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64");
  const CHUNK = 3180;
  if (value.length <= CHUNK) return `sb-${ref}-auth-token=${value}`;
  const parts: string[] = [];
  for (let i = 0; i * CHUNK < value.length; i++) parts.push(`sb-${ref}-auth-token.${i}=${value.slice(i * CHUNK, (i + 1) * CHUNK)}`);
  return parts.join("; ");
}

async function main() {
  // Geçici avukat + dava
  let userId: string;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email: EMAIL, password: PASS, email_confirm: true });
  if (cErr) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list!.users.find((u) => u.email === EMAIL)!.id;
  } else userId = created.user!.id;
  await admin.from("profiles").update({ full_name: "Medya Test Avukat", user_type: "avukat" }).eq("id", userId);
  const { data: kase } = await admin.from("cases")
    .insert({ lawyer_id: userId, title: "Delil Analiz Test Davası", case_number: "2026/777", status: "aktif" }).select().single();
  console.log("1) Avukat + dava hazır");

  const anon = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: signin } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASS });
  const cookie = cookieHeader(signin!.session as never);

  // 2) Gerçek görüntü analizi (eklenti ikonu PNG)
  const png = readFileSync("apps/extension/icon128.png");
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), "delil-foto.png");
  form.append("analysisType", "goruntu");
  form.append("caseId", kase!.id);
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/buro/medya/analyze`, { method: "POST", headers: { Cookie: cookie }, body: form });
  const data = await res.json() as { success?: boolean; result?: { rawText?: string; ozet?: string; hukukiDegerlendirme?: string }; error?: string };
  const raw = data.result?.rawText ?? "";
  console.log(`2) Analiz POST → HTTP ${res.status} | ${Date.now() - t0}ms | rapor ${raw.length} karakter${data.error ? " | HATA: " + data.error : ""}`);
  console.log(`   Uzman perspektifleri: avukat=${/avukat/i.test(raw) ? "✓" : "✗"} hâkim=${/h[âa]kim/i.test(raw) ? "✓" : "✗"} savcı=${/savcı/i.test(raw) ? "✓" : "✗"} bilirkişi=${/bilirkişi/i.test(raw) ? "✓" : "✗"} | delil niteliği=${/delil niteliği/i.test(raw) ? "✓" : "✗"} çelişki/tutarlılık=${/çelişki|tutarlılık/i.test(raw) ? "✓" : "✗"}`);
  console.log(`   Özet ilk 150 kr: ${(data.result?.ozet ?? "").slice(0, 150)}`);
  console.log("   Rapor başlıkları:", raw.split("\n").filter((l) => /^#{1,3}\s|^\*\*[A-ZÇĞİÖŞÜ]/.test(l.trim())).map((l) => l.trim().slice(0, 60)).join(" || "));

  // 3) Analizi Dosyaya Ekle
  const res2 = await fetch(`${BASE}/api/buro/medya/kaydet`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ caseId: kase!.id, fileName: "delil-foto.png", analysisType: "Görüntü Analizi", reportText: raw || "test raporu" }),
  });
  const data2 = await res2.json() as { success?: boolean; document?: { id: string; name: string }; error?: string };
  console.log(`3) Dosyaya Ekle POST → HTTP ${res2.status} | ${data2.success ? `✓ belge: "${data2.document?.name}"` : "HATA: " + data2.error}`);

  // 4) case_documents doğrulaması
  const { data: docs } = await admin.from("case_documents").select("name, file_type, file_size, storage_path").eq("case_id", kase!.id);
  console.log(`4) case_documents: ${docs?.length} kayıt`);
  for (const d of docs ?? []) console.log(`   - ${d.name} | ${d.file_type} | ${d.file_size}B | ${d.storage_path.slice(0, 50)}…`);

  const ok = res.status === 200 && res2.status === 200 && (docs?.length ?? 0) >= 1;
  console.log(`SONUÇ: ${ok ? "✓ Analiz üretildi ve dava dosyasına kaydedildi" : "✗ BAŞARISIZ"}`);

  // 5) Temizlik
  for (const d of docs ?? []) await admin.storage.from("documents").remove([d.storage_path]);
  await admin.from("case_documents").delete().eq("case_id", kase!.id);
  await admin.from("cases").delete().eq("lawyer_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
  console.log("5) Temizlik tamam");
}

main().catch((e) => { console.error("TEST HATASI:", e); process.exit(1); });
