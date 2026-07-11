/* eslint-disable */
// Prod'da eklenti bağlantı kodu akışı testi — geçici Max avukatla /api/extension/token.
// Çalıştırma: node scripts/e2e-extension-token-prod.js
require("dotenv").config({ path: ".env.local", quiet: true });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP = "https://www.xn--mizanm-t9a.com";
const REF = new URL(URL_).hostname.split(".")[0];
const SH = { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" };

(async () => {
  const email = "test-uyap-token@mizanim.test";
  const pass = "TestUyap!2026";

  // Geçici avukat (varsa sil, yeniden oluştur)
  const list = await fetch(`${URL_}/auth/v1/admin/users?per_page=1000`, { headers: SH }).then(r => r.json());
  const existing = (list.users || []).find(u => u.email === email);
  if (existing) await fetch(`${URL_}/auth/v1/admin/users/${existing.id}`, { method: "DELETE", headers: SH });
  const u = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: "POST", headers: SH,
    body: JSON.stringify({ email, password: pass, email_confirm: true, user_metadata: { full_name: "UYAP Token Test" } }),
  }).then(r => r.json());
  if (!u.id) throw new Error("kullanıcı oluşturulamadı: " + JSON.stringify(u));
  await fetch(`${URL_}/rest/v1/profiles?on_conflict=id`, {
    method: "POST", headers: { ...SH, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: u.id, email, full_name: "UYAP Token Test", user_type: "avukat", uyap_uets_active: true }),
  });
  console.log("1) Geçici Max avukat:", u.id);

  // Giriş → cookie
  const session = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  }).then(r => r.json());
  if (!session.access_token) throw new Error("login başarısız");
  const cookie = `sb-${REF}-auth-token=base64-` + Buffer.from(JSON.stringify(session)).toString("base64url");
  console.log("2) Prod login OK");

  // Bağlantı kodu üret
  const res = await fetch(`${APP}/api/extension/token`, { method: "POST", headers: { Cookie: cookie } });
  const data = await res.json();
  console.log(`3) POST ${APP}/api/extension/token → HTTP ${res.status}`);
  if (data.token) {
    const parts = data.token.split(".");
    console.log(`   token formatı: ${parts.length} parça, uzunluk ${data.token.length}, başlangıç: ${data.token.slice(0, 24)}…`);
    console.log(`   lawyerName: ${data.lawyerName}`);
  } else {
    console.log("   yanıt:", JSON.stringify(data));
  }

  // Max bayrağı olmadan 403 dönmeli (INTERNAL_API_SECRET kontrolünden ÖNCE gelir; 200 alınması secret'ın prod'da tanımlı olduğunu kanıtlar)
  const ok = res.status === 200 && !!data.token;
  console.log(`SONUÇ: ${ok ? "✓ 200 + token üretildi → INTERNAL_API_SECRET prod'da tanımlı" : "✗ BAŞARISIZ"}`);

  // Temizlik
  await fetch(`${URL_}/rest/v1/profiles?id=eq.${u.id}`, { method: "DELETE", headers: SH });
  await fetch(`${URL_}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: SH });
  console.log("4) Temizlik tamam");
  if (!ok) process.exit(1);
})().catch((e) => { console.error("TEST HATASI:", e); process.exit(1); });
