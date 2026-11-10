// Onboarding tur/modal manuel UI testi icin tek seferlik test kullanicisi hazirlar.
// Calistir: npx tsx scripts/test-onboarding-setup.ts
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const EMAIL = "onboarding-test@mizanim-e2e.local";
const PASS = "Test-Onboarding-2026!";
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  let userId: string;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email: EMAIL, password: PASS, email_confirm: true });
  if (cErr) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list!.users.find((u) => u.email === EMAIL)!.id;
    await admin.auth.admin.updateUserById(userId, { password: PASS });
  } else userId = created.user!.id;
  await admin.from("profiles").update({ full_name: "Onboarding Test Avukat", user_type: "avukat", onboarding_completed: false }).eq("id", userId);
  console.log("Hazir:", EMAIL, PASS);
}
main();
