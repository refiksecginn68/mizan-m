/* eslint-disable */
// Deploy öncesi düzeltmelerin uçtan uca testi — RAPOR2.md kanıtları.
// Çalıştırma: node scripts/e2e-deploy-fix-test.js  (dev sunucusu localhost:3000)
require("dotenv").config({ path: ".env.local", quiet: true });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP = "http://localhost:3000";
const REF = new URL(URL_).hostname.split(".")[0];
const SH = { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" };
const log = (...a) => console.log(...a);

async function rest(path, opts = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...opts, headers: { ...SH, ...(opts.headers || {}) } });
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) }; } catch { return { status: r.status, body: t }; }
}

async function createUser(email, password, userType) {
  const list = await fetch(`${URL_}/auth/v1/admin/users?per_page=1000`, { headers: SH }).then(r => r.json());
  const existing = (list.users || []).find(u => u.email === email);
  if (existing) await fetch(`${URL_}/auth/v1/admin/users/${existing.id}`, { method: "DELETE", headers: SH });
  const r = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: "POST", headers: SH,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: `Test ${userType}` } }),
  });
  const u = await r.json();
  if (!u.id) throw new Error("kullanıcı oluşturulamadı: " + JSON.stringify(u));
  await rest(`profiles?on_conflict=id`, {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: u.id, email, full_name: `Test ${userType}`, user_type: userType }),
  });
  return u.id;
}

async function loginCookie(email, password) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await r.json();
  if (!session.access_token) throw new Error("login başarısız");
  return `sb-${REF}-auth-token=base64-` + Buffer.from(JSON.stringify(session)).toString("base64url");
}

async function reqDurum(id) {
  const { body } = await rest(`payment_requests?id=eq.${id}&select=status`);
  return body[0]?.status;
}

async function kota(userId) {
  const { body } = await rest(`profiles?id=eq.${userId}&select=monthly_query_count,additional_queries`);
  return body[0];
}

async function postToken(path, token) {
  return fetch(`${APP}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `token=${encodeURIComponent(token)}`,
  });
}

(async () => {
  const pass = "TestOdeme!2026";
  const A = await createUser("test-fix-avukat@mizanim.test", pass, "avukat");
  const B = await createUser("test-fix-vatandas@mizanim.test", pass, "vatandas");
  const cookieA = await loginCookie("test-fix-avukat@mizanim.test", pass);
  const cookieB = await loginCookie("test-fix-vatandas@mizanim.test", pass);
  log("userA:", A, "| userB:", B);

  // ── T8 (önce): mükerrer talep — aynı pakete 3 kez ────────────
  log("\n== T8: mükerrer talep (pro x3) ==");
  const yanitlar = [];
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`${APP}/api/odeme/talep`, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ packageCode: "pro" }),
    });
    yanitlar.push(await r.json());
  }
  log("3 yanıt ref/existing:", yanitlar.map(y => `${y.referenceCode}/${y.existing ? "MEVCUT" : "YENİ"}`).join(" · "));
  const { body: proReqs } = await rest(`payment_requests?user_id=eq.${A}&package_code=eq.pro&status=eq.pending&select=id,reference_code,approval_token`);
  log("DB'de pending pro talebi sayısı (1 olmalı):", proReqs.length);
  const proReq = proReqs[0];

  // ── T1: GET onayla hiçbir şey değiştirmez ────────────────────
  log("\n== T1: GET onayla → değişiklik yok ==");
  const k0 = await kota(A);
  const g1 = await fetch(`${APP}/api/odeme/onayla?token=${proReq.approval_token}`);
  const g1html = await g1.text();
  log("GET HTTP:", g1.status,
    "| özet içeriyor:", ["Test avukat", "Avukat Pro", "1.990", proReq.reference_code, "ONAYLA"].every(s => g1html.includes(s)));
  log("status sonrası:", await reqDurum(proReq.id), "| kota önce/sonra:", JSON.stringify(k0), JSON.stringify(await kota(A)));

  // ── T2: GET x10 (Safe Links simülasyonu) ─────────────────────
  log("\n== T2: GET x10 ==");
  for (let i = 0; i < 10; i++) await fetch(`${APP}/api/odeme/onayla?token=${proReq.approval_token}`);
  log("10 GET sonrası status (pending olmalı):", await reqDurum(proReq.id), "| kota:", JSON.stringify(await kota(A)));

  // ── T3: POST onayla → gerçek onay ────────────────────────────
  log("\n== T3: POST onayla ==");
  const once = await kota(A);
  const p1 = await postToken("/api/odeme/onayla", proReq.approval_token);
  const sonra = await kota(A);
  log("POST HTTP:", p1.status, "| status:", await reqDurum(proReq.id), "| kota:", JSON.stringify(once), "→", JSON.stringify(sonra));
  const { body: tx } = await rest(`credit_transactions?payment_request_id=eq.${proReq.id}&select=amount,type,description`);
  log("transaction:", JSON.stringify(tx[0]));

  // ── T4: POST tekrar → 400 ────────────────────────────────────
  const p2 = await postToken("/api/odeme/onayla", proReq.approval_token);
  log("\n== T4: POST tekrar HTTP (400 beklenir):", p2.status);

  // ── T5: geçersiz + süresi dolmuş token ───────────────────────
  log("\n== T5: geçersiz/süresi dolmuş token ==");
  const gInv = await fetch(`${APP}/api/odeme/onayla?token=gecersiz123`);
  const pInv = await postToken("/api/odeme/onayla", "gecersiz123");
  log("geçersiz: GET", gInv.status, "POST", pInv.status);
  // Süresi dolmuş: kontör talebi oluştur, created_at'i 8 gün geriye çek
  await fetch(`${APP}/api/odeme/talep`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({ packageCode: "kontor_100" }),
  });
  const { body: kReqs } = await rest(`payment_requests?user_id=eq.${A}&package_code=eq.kontor_100&status=eq.pending&select=id,approval_token`);
  const eski = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
  await rest(`payment_requests?id=eq.${kReqs[0].id}`, { method: "PATCH", body: JSON.stringify({ created_at: eski }) });
  const gExp = await fetch(`${APP}/api/odeme/onayla?token=${kReqs[0].approval_token}`);
  const gExpHtml = await gExp.text();
  const pExp = await postToken("/api/odeme/onayla", kReqs[0].approval_token);
  log("süresi dolmuş: GET", gExp.status, "(Süresi Dolmuş:", gExpHtml.includes("Süresi Dolmuş") + ")", "POST", pExp.status,
    "| status hâlâ:", await reqDurum(kReqs[0].id), "| kota değişmedi:", JSON.stringify(await kota(A)));

  // ── T6: reddet akışı ─────────────────────────────────────────
  log("\n== T6: reddet (GET değiştirmez, POST reddeder) ==");
  await fetch(`${APP}/api/odeme/talep`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({ packageCode: "kontor_500" }),
  });
  const { body: rReqs } = await rest(`payment_requests?user_id=eq.${A}&package_code=eq.kontor_500&status=eq.pending&select=id,approval_token`);
  const rr = rReqs[0];
  await fetch(`${APP}/api/odeme/reddet?token=${rr.approval_token}`);
  log("GET reddet sonrası status (pending olmalı):", await reqDurum(rr.id));
  const kOnce = await kota(A);
  const pr = await postToken("/api/odeme/reddet", rr.approval_token);
  log("POST reddet HTTP:", pr.status, "| status:", await reqDurum(rr.id), "| kota değişmedi:", JSON.stringify(kOnce), "=", JSON.stringify(await kota(A)));

  // ── T10: /kredi redirect ─────────────────────────────────────
  log("\n== T10: /kredi → /kredi-yukle ==");
  const red = await fetch(`${APP}/kredi`, { redirect: "manual" });
  log("HTTP:", red.status, "| Location:", red.headers.get("location"));

  // ── T11: regresyon — kota/arama/402 ─────────────────────────
  log("\n== T11: regresyon ==");
  const q1 = await kota(A);
  const chat = await fetch(`${APP}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({ message: "İhtarname nedir? Tek cümle.", userType: "avukat" }),
  });
  if (chat.ok) await chat.text();
  const q2 = await kota(A);
  log("chat HTTP:", chat.status, "| kota:", JSON.stringify(q1), "→", JSON.stringify(q2));
  const emsal = await fetch(`${APP}/api/emsal/search?q=ihtarname&limit=1`, { headers: { Cookie: cookieA } });
  const q3 = await kota(A);
  log("emsal HTTP:", emsal.status, "| arama sonrası kota aynı mı:", JSON.stringify(q2) === JSON.stringify(q3));
  const chatB = await fetch(`${APP}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookieB },
    body: JSON.stringify({ message: "Merhaba", userType: "vatandas" }),
  });
  const chatBBody = await chatB.json().catch(() => null);
  log("kota 0 chat HTTP:", chatB.status, "| cta:", chatBBody?.cta?.href);

  log("\nTEST BİTTİ — test kullanıcı id'leri:", A, B);
})().catch((e) => { console.error("TEST HATASI:", e); process.exit(1); });
