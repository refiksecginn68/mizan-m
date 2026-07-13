/* eslint-disable */
// Landing "Ürün Turu" için gerçek uygulama ekran görüntüleri (localhost:3000, test avukat hesabı)
// Çalıştırma: node scripts/capture-screens.js
require("dotenv").config({ path: ".env.local", quiet: true });
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP = "http://localhost:3000";
const REF = new URL(URL_).hostname.split(".")[0];
const SH = { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" };
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "public/images/screens";

const EMAIL = "test-screens-avukat@mizanim.test";
const PASS = "TestScreens!2026";

async function rest(path, opts = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...opts, headers: { ...SH, ...(opts.headers || {}) } });
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) }; } catch { return { status: r.status, body: t }; }
}

async function ensureUser() {
  const list = await fetch(`${URL_}/auth/v1/admin/users?per_page=1000`, { headers: SH }).then(r => r.json());
  const existing = (list.users || []).find(u => u.email === EMAIL);
  if (existing) await fetch(`${URL_}/auth/v1/admin/users/${existing.id}`, { method: "DELETE", headers: SH });
  const r = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: "POST", headers: SH,
    body: JSON.stringify({ email: EMAIL, password: PASS, email_confirm: true, user_metadata: { full_name: "Av. Mehmet Kaya" } }),
  });
  const u = await r.json();
  if (!u.id) throw new Error("kullanıcı oluşturulamadı: " + JSON.stringify(u));
  await rest(`profiles?on_conflict=id`, {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      id: u.id, email: EMAIL, full_name: "Mehmet Kaya", user_type: "avukat", onboarding_completed: true,
      monthly_query_limit: 500, monthly_query_count: 132,
    }),
  });
  return u.id;
}

async function seed(userId) {
  // Panelin dolu görünmesi için örnek dosya + müvekkil + duruşma
  const clients = [
    { lawyer_id: userId, full_name: "Ayşe Demir", email: "ayse@example.com", phone: "0532 000 00 01" },
    { lawyer_id: userId, full_name: "Mehmet Yılmaz", email: "mehmet@example.com", phone: "0532 000 00 02" },
    { lawyer_id: userId, full_name: "Zeynep Arslan", email: "zeynep@example.com", phone: "0532 000 00 03" },
  ];
  const { body: cRows, status } = await rest("clients", {
    method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(clients),
  });
  if (status >= 300) { console.log("clients seed atlandı:", status, JSON.stringify(cRows).slice(0, 200)); return; }
  const cases = [
    { lawyer_id: userId, client_id: cRows[0].id, title: "İşe İade Davası — Demir / Atlas Tekstil A.Ş.", case_number: "2026/482", court: "İstanbul 12. İş Mahkemesi", status: "aktif", opened_at: "2026-03-02" },
    { lawyer_id: userId, client_id: cRows[1].id, title: "Kira Tespit Davası — Yılmaz / Kaya Gayrimenkul", case_number: "2026/117", court: "Kadıköy 3. Sulh Hukuk Mahkemesi", status: "aktif", opened_at: "2026-01-15" },
    { lawyer_id: userId, client_id: cRows[2].id, title: "Maddi-Manevi Tazminat — Arslan / X Sigorta", case_number: "2025/2041", court: "Ankara 5. Asliye Hukuk Mahkemesi", status: "aktif", opened_at: "2025-11-20" },
  ];
  const { status: s2, body: b2 } = await rest("cases", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(cases) });
  if (s2 >= 300) { console.log("cases seed atlandı:", s2, JSON.stringify(b2).slice(0, 200)); return; }
  const soon = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString(); };
  const events = [
    { lawyer_id: userId, case_id: b2[0].id, client_id: null, title: "Duruşma — İşe İade (2026/482)", event_type: "durusma", starts_at: soon(2), location: "İstanbul 12. İş Mahkemesi" },
    { lawyer_id: userId, case_id: b2[2].id, client_id: null, title: "Bilirkişi raporuna beyan süresi", event_type: "sure", starts_at: soon(5), location: null },
    { lawyer_id: userId, case_id: null, client_id: cRows[2].id, title: "Müvekkil görüşmesi — Z. Arslan", event_type: "toplanti", starts_at: soon(1), location: null },
  ];
  const { status: s3, body: b3 } = await rest("calendar_events", { method: "POST", body: JSON.stringify(events) });
  if (s3 >= 300) console.log("events seed atlandı:", s3, JSON.stringify(b3).slice(0, 200));
  return { cRows, cases: b2 };
}

async function seedFinans(cookie, seeded) {
  const H = { "Content-Type": "application/json", Cookie: cookie };
  const kayitlar = [
    { amount: 25000, status: "success", description: "Vekâlet ücreti (1/3)", direction: "gelir", client_id: seeded.cRows[0].id, client_name: seeded.cRows[0].full_name, case_id: seeded.cases[0].id, case_title: seeded.cases[0].case_number },
    { amount: 25000, status: "pending", description: "Vekâlet ücreti (2/3)", direction: "gelir", client_id: seeded.cRows[0].id, client_name: seeded.cRows[0].full_name, case_id: seeded.cases[0].id, case_title: seeded.cases[0].case_number, due_date: new Date(Date.now() + 30 * 864e5).toISOString() },
    { amount: 8500, status: "success", description: "Danışmanlık ücreti", direction: "gelir", client_id: seeded.cRows[1].id, client_name: seeded.cRows[1].full_name },
    { amount: 4200, status: "success", description: "Bilirkişi ücreti", direction: "gider", case_id: seeded.cases[2].id, case_title: seeded.cases[2].case_number },
    { amount: 1750, status: "success", description: "Harç ve masraflar", direction: "gider" },
  ];
  for (const k of kayitlar) {
    const r = await fetch(`${APP}/api/buro/finans`, { method: "POST", headers: H, body: JSON.stringify(k) });
    if (r.status >= 300) console.log("finans seed atlandı:", r.status, (await r.text()).slice(0, 150));
  }
}

async function loginCookieChunks() {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const session = await r.json();
  if (!session.access_token) throw new Error("login başarısız: " + JSON.stringify(session).slice(0, 200));
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const name = `sb-${REF}-auth-token`;
  // @supabase/ssr chunk sınırı 3180 karakter
  if (value.length <= 3180) return [{ name, value }];
  const chunks = [];
  for (let i = 0; i * 3180 < value.length; i++) {
    chunks.push({ name: `${name}.${i}`, value: value.slice(i * 3180, (i + 1) * 3180) });
  }
  return chunks;
}

const PAGES = [
  { path: "/buro", file: "buro-anasayfa.png", wait: 4000 },
  { path: "/buro/emsal", file: "emsal-arama.png", wait: 3000, search: "işe iade davasında boşta geçen süre ücreti" },
  { path: "/buro/mevzuat", file: "mevzuat-arama.png", wait: 3000, search: "iş kanunu" },
  { path: "/buro/dilekce", file: "dilekce.png", wait: 3000 },
  { path: "/buro/asistan", file: "mizanai.png", wait: 3000 },
  { path: "/buro/uyap", file: "uyap.png", wait: 3000 },
  { path: "/buro/tebligat", file: "uets.png", wait: 3000 },
  { path: "/buro/finans", file: "finans.png", wait: 3000 },
  { path: "/buro/davalar", file: "davalar.png", wait: 3000 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const userId = await ensureUser();
  console.log("test kullanıcı:", userId);
  const seeded = await seed(userId);
  const cookies = await loginCookieChunks();
  console.log("cookie chunk sayısı:", cookies.length);
  if (seeded) await seedFinans(cookies.map(c => `${c.name}=${c.value}`).join("; "), seeded);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--window-size=1600,1000", "--hide-scrollbars"],
    defaultViewport: { width: 1440, height: 810, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  await page.setCookie(...cookies.map(c => ({ ...c, domain: "localhost", path: "/", httpOnly: false, secure: false })));
  // Çerez bandını gizle
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("cookie-consent", "all");
    localStorage.setItem("pwa-dismissed", "1");
  });

  for (const p of PAGES) {
    try {
      await page.goto(APP + p.path, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise(r => setTimeout(r, p.wait));
      if (p.search) {
        // Arama kutusuna sorgu yazıp sonuçları bekle
        const typed = await page.evaluate((q) => {
          const input = document.querySelector('input[type="text"], input[type="search"], input[placeholder*="ara" i], input[placeholder*="yaz" i]');
          if (!input) return false;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(input, q);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }, p.search);
        if (typed) {
          // "Ara" butonuna tıkla (Enter her formda bağlı değil)
          const clicked = await page.evaluate(() => {
            const btn = [...document.querySelectorAll("button")].find(b => /(^|\s)Ara(\s|$)/.test(b.textContent.trim()));
            if (btn) { btn.click(); return true; }
            return false;
          });
          if (!clicked) await page.keyboard.press("Enter");
          // Skeleton kaybolana kadar bekle (en çok 60 sn)
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const busy = await page.evaluate(() => !!document.querySelector('[class*="animate-pulse"], [class*="skeleton" i]'));
            if (!busy && i >= 2) break;
          }
          await new Promise(r => setTimeout(r, 1500));
        } else {
          console.log("arama kutusu bulunamadı:", p.path);
        }
      }
      await page.screenshot({ path: `${OUT}/${p.file}` });
      console.log("OK", p.path, "→", p.file, "| url:", page.url());
    } catch (e) {
      console.log("HATA", p.path, e.message);
    }
  }
  await browser.close();
})();
