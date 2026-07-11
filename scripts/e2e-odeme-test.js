/* eslint-disable */
// Uçtan uca ödeme/kota testi — RAPOR.md kanıtları için.
// Çalıştırma: node scripts/e2e-odeme-test.js  (dev sunucusu localhost:3000'de olmalı)
require("dotenv").config({ path: ".env.local", quiet: true });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP = "http://localhost:3000";
const REF = new URL(URL_).hostname.split(".")[0];
const SH = { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" };

const log = (...a) => console.log(...a);

async function rest(path, opts = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: SH, ...opts, headers: { ...SH, ...(opts.headers || {}) } });
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) }; } catch { return { status: r.status, body: t }; }
}

async function createUser(email, password, userType) {
  // Varsa sil
  const list = await fetch(`${URL_}/auth/v1/admin/users?per_page=1000`, { headers: SH }).then(r => r.json());
  const existing = (list.users || []).find(u => u.email === email);
  if (existing) await fetch(`${URL_}/auth/v1/admin/users/${existing.id}`, { method: "DELETE", headers: SH });

  const r = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: "POST", headers: SH,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: `Test ${userType}` } }),
  });
  const u = await r.json();
  if (!u.id) throw new Error("kullanıcı oluşturulamadı: " + JSON.stringify(u));
  // profiles satırı (trigger yoksa upsert)
  await rest(`profiles?on_conflict=id`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: u.id, email, full_name: `Test ${userType}`, user_type: userType }),
  });
  return u.id;
}

async function loginCookie(email, password) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await r.json();
  if (!session.access_token) throw new Error("login başarısız: " + JSON.stringify(session));
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  // 3180 karakterde chunk'lama
  const name = `sb-${REF}-auth-token`;
  if (value.length <= 3180) return { cookie: `${name}=${value}`, session };
  const chunks = [];
  for (let i = 0; i < value.length; i += 3180) chunks.push(value.slice(i, i + 3180));
  return { cookie: chunks.map((c, i) => `${name}.${i}=${c}`).join("; "), session };
}

async function getProfile(id) {
  const { body } = await rest(`profiles?id=eq.${id}&select=email,user_type,monthly_query_limit,monthly_query_count,additional_queries,uyap_uets_active`);
  return body[0];
}

(async () => {
  const sonuc = {};

  // ── Kullanıcılar ─────────────────────────────────────────────
  log("== Test kullanıcıları oluşturuluyor ==");
  const pass = "TestOdeme!2026";
  const userA = await createUser("test-odeme-avukat@mizanim.test", pass, "avukat");
  const userB = await createUser("test-odeme-vatandas@mizanim.test", pass, "vatandas");
  log("userA (avukat):", userA, "| userB (vatandas):", userB);

  const { cookie: cookieA } = await loginCookie("test-odeme-avukat@mizanim.test", pass);
  const { cookie: cookieB, session: sessionB } = await loginCookie("test-odeme-vatandas@mizanim.test", pass);

  // ── K1: Pro talep ────────────────────────────────────────────
  log("\n== K1: /api/odeme/talep (pro) ==");
  const talep = await fetch(`${APP}/api/odeme/talep`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({ packageCode: "pro" }),
  });
  const talepBody = await talep.json();
  log("HTTP", talep.status, JSON.stringify(talepBody));
  sonuc.k1_http = talep.status;
  sonuc.k1_ref = talepBody.referenceCode;

  const { body: prRows } = await rest(`payment_requests?user_id=eq.${userA}&order=created_at.desc&limit=1&select=id,package_code,amount_try,reference_code,status,approval_token`);
  log("DB payment_request:", JSON.stringify({ ...prRows[0], approval_token: prRows[0]?.approval_token?.slice(0, 8) + "..." }));
  sonuc.k1_db_status = prRows[0]?.status;
  const proToken = prRows[0]?.approval_token;
  sonuc.k2_adminNotified = talepBody.adminNotified;

  // ── K3: ONAYLA linki ─────────────────────────────────────────
  log("\n== K3: /api/odeme/onayla ==");
  const before = await getProfile(userA);
  log("ÖNCE:", JSON.stringify(before));
  const onay = await fetch(`${APP}/api/odeme/onayla?token=${proToken}`);
  log("onayla HTTP:", onay.status);
  const after = await getProfile(userA);
  log("SONRA:", JSON.stringify(after));
  sonuc.k3 = { onayHttp: onay.status, once: before.additional_queries, sonra: after.additional_queries };
  const { body: tx } = await rest(`credit_transactions?user_id=eq.${userA}&type=eq.purchase&order=created_at.desc&limit=1&select=amount,type,description,payment_request_id`);
  log("transaction:", JSON.stringify(tx[0]));
  const { body: rem } = await rest(`payment_reminders?user_id=eq.${userA}&select=package_code,next_reminder_at,active`);
  log("reminder:", JSON.stringify(rem[0]));
  sonuc.k6_pro_uyap = after.uyap_uets_active; // pro sonrası false olmalı

  // Token tekrar kullanımı
  const tekrar = await fetch(`${APP}/api/odeme/onayla?token=${proToken}`);
  log("token tekrar kullanım HTTP (400 beklenir):", tekrar.status);
  sonuc.k3_tekrar = tekrar.status;

  // ── K4: AI sohbet 1 kota düşer, ham arama düşmez ─────────────
  log("\n== K4: AI sohbet + ham arama ==");
  const q1 = await getProfile(userA);
  const chat = await fetch(`${APP}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({ message: "Kıdem tazminatı nedir? Tek cümleyle.", userType: "avukat" }),
  });
  log("chat HTTP:", chat.status);
  if (chat.ok) { await chat.text(); } // stream'i tüket
  const q2 = await getProfile(userA);
  log(`kota: önce add=${q1.additional_queries} count=${q1.monthly_query_count} → sonra add=${q2.additional_queries} count=${q2.monthly_query_count}`);
  sonuc.k4_chat = { http: chat.status, dusen: (q1.monthly_query_limit - q1.monthly_query_count + q1.additional_queries) - (q2.monthly_query_limit - q2.monthly_query_count + q2.additional_queries) };

  const emsal = await fetch(`${APP}/api/emsal/search?q=kidem%20tazminati&limit=2`, { headers: { Cookie: cookieA } });
  log("emsal/search HTTP:", emsal.status);
  const q3 = await getProfile(userA);
  const aramaDustu = (q2.additional_queries !== q3.additional_queries) || (q2.monthly_query_count !== q3.monthly_query_count);
  log("ham arama sonrası kota değişti mi:", aramaDustu);
  sonuc.k4_arama = { http: emsal.status, kotaDegisti: aramaDustu };

  // ── K5: kota 0 kullanıcıda 402 + CTA, ham arama 200 ──────────
  log("\n== K5: kota 0 → 402 ==");
  const chatB = await fetch(`${APP}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieB },
    body: JSON.stringify({ message: "Merhaba", userType: "vatandas" }),
  });
  const chatBBody = await chatB.json().catch(() => null);
  log("kota 0 chat HTTP:", chatB.status, JSON.stringify(chatBBody));
  const emsalB = await fetch(`${APP}/api/emsal/search?q=nafaka&limit=1`, { headers: { Cookie: cookieB } });
  log("kota 0 ham arama HTTP:", emsalB.status);
  sonuc.k5 = { chatHttp: chatB.status, cta: chatBBody?.cta?.href, aramaHttp: emsalB.status };

  // ── K6: Max onayı → uyap_uets_active ─────────────────────────
  log("\n== K6: Max onayı ==");
  const talepMax = await fetch(`${APP}/api/odeme/talep`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({ packageCode: "max" }),
  });
  const talepMaxBody = await talepMax.json();
  const { body: prMax } = await rest(`payment_requests?user_id=eq.${userA}&package_code=eq.max&order=created_at.desc&limit=1&select=approval_token`);
  await fetch(`${APP}/api/odeme/onayla?token=${prMax[0].approval_token}`);
  const afterMax = await getProfile(userA);
  log(`max sonrası: uyap_uets_active=${afterMax.uyap_uets_active} add=${afterMax.additional_queries}`);
  sonuc.k6 = { proSonrasi: sonuc.k6_pro_uyap, maxSonrasi: afterMax.uyap_uets_active, refMax: talepMaxBody.referenceCode };

  // ── K7: reminder cron ────────────────────────────────────────
  log("\n== K7: reminder cron ==");
  const dun = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  await rest(`payment_reminders?user_id=eq.${userA}&package_code=eq.pro`, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ next_reminder_at: dun }),
  });
  const cron = await fetch(`${APP}/api/cron/odeme-hatirlatma`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const cronBody = await cron.json();
  log("cron HTTP:", cron.status, JSON.stringify(cronBody));
  const { body: remAfter } = await rest(`payment_reminders?user_id=eq.${userA}&package_code=eq.pro&select=next_reminder_at,active`);
  log("reminder sonrası:", JSON.stringify(remAfter[0]), "| dün:", dun);
  sonuc.k7 = { http: cron.status, cronBody, yeniVade: remAfter[0]?.next_reminder_at };

  // Cron yetkisiz erişim
  const cronYetkisiz = await fetch(`${APP}/api/cron/odeme-hatirlatma`);
  log("cron yetkisiz HTTP (401 beklenir):", cronYetkisiz.status);

  // ── K10: RLS ─────────────────────────────────────────────────
  log("\n== K10: RLS ==");
  const anonH = { apikey: ANON, Authorization: `Bearer ${sessionB.access_token}`, "Content-Type": "application/json" };
  // B, tüm satırları çekmeye çalışır (A'nın talepleri görünmemeli)
  const rls1 = await fetch(`${URL_}/rest/v1/payment_requests?select=id,user_id,reference_code,status`, { headers: anonH });
  const rls1Body = await rls1.json();
  log("B'nin görebildiği payment_requests satır sayısı (0 beklenir):", Array.isArray(rls1Body) ? rls1Body.length : rls1Body);
  // approval_token kolonu seçilmeye çalışılır (yetki hatası beklenir)
  const rls2 = await fetch(`${URL_}/rest/v1/payment_requests?select=approval_token`, { headers: anonH });
  const rls2Body = await rls2.text();
  log("approval_token SELECT HTTP (izin hatası beklenir):", rls2.status, rls2Body.slice(0, 120));
  const rls3 = await fetch(`${URL_}/rest/v1/credit_transactions?select=user_id`, { headers: anonH });
  const rls3Body = await rls3.json();
  log("B'nin görebildiği credit_transactions (yalnız kendisi):", Array.isArray(rls3Body) ? [...new Set(rls3Body.map(r => r.user_id))] : rls3Body);
  sonuc.k10 = { yabanciSatir: Array.isArray(rls1Body) ? rls1Body.length : -1, tokenSelectHttp: rls2.status };

  log("\n== ÖZET ==");
  log(JSON.stringify(sonuc, null, 2));
})().catch((e) => { console.error("TEST HATASI:", e); process.exit(1); });
