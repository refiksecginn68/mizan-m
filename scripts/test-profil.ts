// Avukat profil sayfası E2E testi — PATCH alanlar, POST foto/belge, MizanAI bağlam doğrulaması.
// Çalıştır: npx tsx scripts/test-profil.ts  (dev sunucu açık olmalı)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BASE = "http://localhost:3000";
const EMAIL = "profil-test@mizanim-e2e.local";
const PASS = "Test-Profil-2026!";
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
  let userId: string;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email: EMAIL, password: PASS, email_confirm: true });
  if (cErr) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list!.users.find((u) => u.email === EMAIL)!.id;
  } else userId = created.user!.id;
  await admin.from("profiles").update({ full_name: "Profil Test Avukat", user_type: "avukat" }).eq("id", userId);
  console.log("1) Test avukat hazır");

  const anon = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: signin } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASS });
  const cookie = cookieHeader(signin!.session as never);
  const H = { "Content-Type": "application/json", Cookie: cookie };

  // 2) Alanları doldur (PATCH)
  const r2 = await fetch(`${BASE}/api/buro/profil`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({
      full_name: "Profil Test Avukat",
      phone: "0555 111 22 33",
      bar_city: "İstanbul",
      bar_number: "54321",
      university: "Ankara Üniversitesi Hukuk Fakültesi",
      specializations: ["İş ve Sosyal Güvenlik Hukuku", "Sigorta ve Tazminat Hukuku"],
      achievements: "12 yıllık iş hukuku deneyimi",
      hobbies: "Satranç",
      personal_notes: "Pzt sabahları duruşma yoğun",
    }),
  });
  const d2 = await r2.json() as { success?: boolean; profile?: { bar_city: string; specializations: string[] }; error?: string };
  console.log(`2) PATCH profil → HTTP ${r2.status} | baro=${d2.profile?.bar_city} | uzmanlık=${d2.profile?.specializations?.join("+")}${d2.error ? " HATA: " + d2.error : ""}`);

  // 3) Profil fotoğrafı yükle (PNG)
  const png = readFileSync("apps/extension/icon128.png");
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), "avatar.png");
  fd.append("kind", "avatar");
  const r3 = await fetch(`${BASE}/api/buro/profil`, { method: "POST", headers: { Cookie: cookie }, body: fd });
  const d3 = await r3.json() as { success?: boolean; avatar_url?: string; error?: string };
  console.log(`3) Foto POST → HTTP ${r3.status} | avatar_url: ${d3.avatar_url ? d3.avatar_url.slice(0, 70) + "…" : "YOK"}${d3.error ? " HATA: " + d3.error : ""}`);

  // 3b) Ek belge yükle
  const fd2 = new FormData();
  fd2.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), "diploma.png");
  fd2.append("kind", "belge");
  const r3b = await fetch(`${BASE}/api/buro/profil`, { method: "POST", headers: { Cookie: cookie }, body: fd2 });
  const d3b = await r3b.json() as { success?: boolean; document?: { name: string }; error?: string };
  console.log(`3b) Belge POST → HTTP ${r3b.status} | ${d3b.document?.name ?? d3b.error}`);

  // 4) GET ile doğrula
  const r4 = await fetch(`${BASE}/api/buro/profil`, { headers: H });
  const d4 = await r4.json() as { profile?: { university: string; profile_documents: Array<{ name: string; url: string | null }>; avatar_url: string | null } };
  console.log(`4) GET profil → HTTP ${r4.status} | üniversite=${d4.profile?.university} | belge sayısı=${d4.profile?.profile_documents?.length} (imzalı url: ${d4.profile?.profile_documents?.[0]?.url ? "✓" : "✗"}) | avatar: ${d4.profile?.avatar_url ? "✓" : "✗"}`);

  // 5) MizanAI profili görüyor mu? (asistanın kendisine sor)
  const r5 = await fetch(`${BASE}/api/buro/mizanai`, {
    method: "POST", headers: H,
    body: JSON.stringify({ message: "Profilime göre uzmanlık alanlarım ve barom nedir? Tek cümleyle söyle." }),
  });
  const text5 = await r5.text();
  // SSE veya JSON olabilir — düz metinde ara
  const gorursIs = /iş.{0,30}(hukuku|güvenli)/i.test(text5);
  const gorursSigorta = /sigorta/i.test(text5);
  const gorursBaro = /istanbul/i.test(text5);
  console.log(`5) MizanAI → HTTP ${r5.status} | yanıtta İş Hukuku: ${gorursIs ? "✓" : "✗"} | Sigorta: ${gorursSigorta ? "✓" : "✗"} | İstanbul Barosu: ${gorursBaro ? "✓" : "✗"}`);
  const snippet = text5.replace(/\s+/g, " ").match(/uzmanlık|İstanbul|iş hukuku/i) ? text5.replace(/data: /g, "").replace(/\s+/g, " ").slice(0, 300) : text5.slice(0, 200);
  console.log(`   Yanıt kesiti: ${snippet}`);

  const ok = r2.status === 200 && r3.status === 200 && r4.status === 200 && gorursIs && gorursBaro;
  console.log(`SONUÇ: ${ok ? "✓ Profil kaydı + foto + MizanAI bağlamı ÇALIŞIYOR" : "✗ eksik var"}`);

  // 6) Temizlik
  const { data: prof } = await admin.from("profiles").select("profile_documents").eq("id", userId).single();
  const paths = ((prof?.profile_documents as Array<{ path: string }>) ?? []).map((d) => d.path);
  if (paths.length) await admin.storage.from("documents").remove(paths);
  await admin.storage.from("documents").remove([`${userId}`]); // avatar klasörü best-effort
  await admin.from("messages").delete().eq("user_id", userId);
  await admin.from("sessions").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
  console.log("6) Temizlik tamam");
}

main().catch((e) => { console.error("TEST HATASI:", e); process.exit(1); });
