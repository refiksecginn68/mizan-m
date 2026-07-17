"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { cihazKaydet, cihazDusur, aktifCihazlar, CIHAZ_COOKIE } from "@/lib/services/oturum";

export async function logoutAction() {
  const supabase = createClient();
  // Bu cihazın oturum kaydını da düşür
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const deviceId = cookies().get(CIHAZ_COOKIE)?.value;
    if (user && deviceId) {
      const cihazlar = await aktifCihazlar(user.id);
      const bu = cihazlar.find((c) => c.device_id === deviceId);
      if (bu) await cihazDusur(user.id, bu.id);
    }
  } catch { /* oturum kaydı düşmese de çıkış devam eder */ }
  cookies().delete(CIHAZ_COOKIE);
  // Yalnızca bu cihazın oturumu kapanır — diğer cihazlar cihaz limitiyle yönetilir
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}

function translateLoginError(msg: string): string {
  if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) return "E-posta veya şifre hatalı.";
  if (msg.includes("Email not confirmed")) return "E-postanızı doğrulamanız gerekiyor.";
  if (msg.includes("rate limit")) return "Çok fazla deneme. Lütfen biraz bekleyin.";
  return "Giriş başarısız. Lütfen tekrar deneyin.";
}

export async function loginAction(
  formData: FormData
): Promise<{ error: string } | { destination: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  if (!email || !password) {
    return { error: "E-posta ve şifre zorunludur." };
  }

  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    console.error("[loginAction] auth error:", error?.message);
    return { error: translateLoginError(error?.message ?? "") };
  }

  const { data: profile } = await supabaseAny
    .from("profiles")
    .select("user_type")
    .eq("id", data.user.id)
    .single();

  const userType: string = profile?.user_type ?? "vatandas";
  console.log("[loginAction] user:", data.user.email, "type:", userType);

  // Eşzamanlı oturum limiti: cihazı kaydet, limit üstündeki eski cihazlar düşer
  try {
    const h = headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;
    const deviceId = await cihazKaydet(data.user.id, h.get("user-agent"), ip);
    cookies().set(CIHAZ_COOKIE, deviceId, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, path: "/",
    });
  } catch (e) {
    console.error("[loginAction] cihaz kaydı başarısız:", e);
  }

  let destination: string;
  if (redirectTo && userType === "avukat" && redirectTo.startsWith("/buro")) {
    destination = redirectTo;
  } else if (redirectTo && userType === "vatandas" && !redirectTo.startsWith("/buro")) {
    destination = redirectTo;
  } else {
    destination = userType === "avukat" ? "/buro" : "/panel";
  }

  // redirect() yerine destination döndür — client window.location.href kullanacak.
  // redirect() Next.js'de NEXT_REDIRECT exception fırlatır ve try/catch tarafından
  // yakalanabilir, bu da navigasyonun çalışmamasına neden olur.
  return { destination };
}
