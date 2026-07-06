// Finans modülü uçtan uca testi — geçici avukat hesabıyla gerçek API çağrıları.
// Çalıştır: npx tsx scripts/test-finans.ts  (dev sunucu 3000'de açık olmalı)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// .env.local'ı elle yükle
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE = "http://localhost:3000";
const EMAIL = "finans-test@mizanim-e2e.local";
const PASS = "Test-Finans-2026!";

const admin = createClient(URL_, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

function cookieHeader(session: { access_token: string; refresh_token: string } & Record<string, unknown>): string {
  const ref = URL_.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? "";
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64");
  // @supabase/ssr 3180 karakterte böler (chunk)
  const CHUNK = 3180;
  if (value.length <= CHUNK) return `sb-${ref}-auth-token=${value}`;
  const parts: string[] = [];
  for (let i = 0; i * CHUNK < value.length; i++) {
    parts.push(`sb-${ref}-auth-token.${i}=${value.slice(i * CHUNK, (i + 1) * CHUNK)}`);
  }
  return parts.join("; ");
}

async function main() {
  // 1) Geçici avukat kullanıcısı
  let userId: string;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email: EMAIL, password: PASS, email_confirm: true,
  });
  if (cErr) {
    // zaten varsa bul
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === EMAIL);
    if (!existing) throw new Error("Kullanıcı oluşturulamadı: " + cErr.message);
    userId = existing.id;
  } else {
    userId = created.user!.id;
  }
  // Trigger profili "vatandas" oluşturur — avukat'a çevir (email NOT NULL, update kullan)
  const { error: pErr } = await admin.from("profiles")
    .update({ full_name: "Finans Test Avukat", user_type: "avukat" })
    .eq("id", userId);
  if (pErr) throw new Error("Profil güncellenemedi: " + pErr.message);
  console.log("1) Test avukat hazır:", userId.slice(0, 8) + "…");

  // 2) Test müvekkil + dosya
  const { data: client } = await admin.from("clients")
    .insert({ lawyer_id: userId, full_name: "E2E Müvekkil", is_active: true }).select().single();
  const { data: kase } = await admin.from("cases")
    .insert({ lawyer_id: userId, client_id: client!.id, title: "E2E Tazminat Davası", case_number: "2026/999", status: "aktif" }).select().single();
  console.log("2) Müvekkil + dosya oluşturuldu:", client!.id.slice(0, 8) + "…", kase!.id.slice(0, 8) + "…");

  // 3) Oturum aç → cookie üret
  const anon = createClient(URL_, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: signin, error: sErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASS });
  if (sErr || !signin.session) throw new Error("Giriş başarısız: " + sErr?.message);
  const cookie = cookieHeader(signin.session as never);
  const H = { "Content-Type": "application/json", Cookie: cookie };

  // 4) Müvekkil ödemesi (gelir) — taksitli 3 aylık
  const taksitler: string[] = [];
  for (let i = 0; i < 3; i++) {
    const due = new Date(); due.setMonth(due.getMonth() + i);
    const res = await fetch(`${BASE}/api/buro/finans`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        amount: 5000, status: i === 0 ? "success" : "pending",
        description: `Vekalet ücreti (${i + 1}/3)`,
        direction: "gelir", client_id: client!.id, client_name: client!.full_name,
        case_id: kase!.id, case_title: kase!.case_number, due_date: due.toISOString(),
      }),
    });
    const d = await res.json() as { payment?: { id: string }; error?: string };
    console.log(`4.${i + 1}) Taksit POST → HTTP ${res.status}${d.error ? " HATA: " + d.error : " id=" + d.payment!.id.slice(0, 8) + "…"}`);
    if (d.payment) taksitler.push(d.payment.id);
  }

  // 5) Serbest gelir + gider
  const r5 = await fetch(`${BASE}/api/buro/finans`, {
    method: "POST", headers: H,
    body: JSON.stringify({ amount: 2500, status: "success", description: "Danışmanlık ücreti", direction: "gelir" }),
  });
  console.log("5a) Serbest gelir POST → HTTP", r5.status);
  const r5b = await fetch(`${BASE}/api/buro/finans`, {
    method: "POST", headers: H,
    body: JSON.stringify({ amount: 1200, status: "success", description: "Büro kirası", direction: "gider" }),
  });
  console.log("5b) Gider POST → HTTP", r5b.status);

  // 6) Taksit 2'yi "Ödendi" işaretle (PATCH)
  const r6 = await fetch(`${BASE}/api/buro/finans`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ id: taksitler[1], status: "success" }),
  });
  const d6 = await r6.json() as { payment?: { status: string } };
  console.log("6) PATCH taksit-2 Ödendi → HTTP", r6.status, "| yeni durum:", d6.payment?.status);

  // 7) GET ile doğrula + gelir/gider analizi
  const r7 = await fetch(`${BASE}/api/buro/finans`, { headers: H });
  const d7 = await r7.json() as { payments: Array<{ amount: number; status: string; metadata?: { direction?: string; client_name?: string; due_date?: string } }> };
  const gelir = d7.payments.filter((p) => p.status === "success" && p.metadata?.direction !== "gider").reduce((s, p) => s + p.amount, 0);
  const gider = d7.payments.filter((p) => p.status === "success" && p.metadata?.direction === "gider").reduce((s, p) => s + p.amount, 0);
  const bekleyen = d7.payments.filter((p) => p.status === "pending").length;
  const iliskili = d7.payments.filter((p) => p.metadata?.client_name === "E2E Müvekkil").length;
  console.log(`7) GET → HTTP ${r7.status} | ${d7.payments.length} kayıt | gelir=${gelir} gider=${gider} bakiye=${gelir - gider} | bekleyen taksit=${bekleyen} | müvekkil-ilişkili=${iliskili}`);
  console.log(`   BEKLENEN: gelir=12500 (5000+5000+2500) gider=1200 bakiye=11300 bekleyen=1 ilişkili=3 → ${gelir === 12500 && gider === 1200 && bekleyen === 1 && iliskili === 3 ? "✓ TÜMÜ DOĞRU" : "✗ UYUŞMAZLIK"}`);

  // 8) Temizlik
  await admin.from("payments").delete().eq("user_id", userId);
  await admin.from("cases").delete().eq("lawyer_id", userId);
  await admin.from("clients").delete().eq("lawyer_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
  console.log("8) Temizlik tamam (test verileri silindi)");
}

main().catch((e) => { console.error("TEST HATASI:", e); process.exit(1); });
