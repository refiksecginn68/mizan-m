"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
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
