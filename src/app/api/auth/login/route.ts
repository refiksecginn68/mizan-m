import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-posta ve şifre zorunludur." }, { status: 400 });
    }

    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { error: translateError(error.message) },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", data.user.id)
      .single();

    return NextResponse.json({ userType: profile?.user_type ?? "vatandas" });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) return "E-posta veya şifre hatalı.";
  if (msg.includes("Email not confirmed")) return "E-postanızı doğrulamanız gerekiyor.";
  if (msg.includes("rate limit")) return "Çok fazla deneme. Lütfen biraz bekleyin.";
  return "Giriş başarısız. Lütfen tekrar deneyin.";
}
