import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, password, user_type, phone, bar_number } = body;

    if (!full_name || !email || !password || !user_type) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          user_type,
          phone: phone ?? null,
          bar_number: bar_number ?? null,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: translateError(error.message) },
        { status: 400 }
      );
    }

    // Resend varsa özel markalı email gönder (Supabase'in default emailini geçersiz kılar)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
    if (RESEND_API_KEY && APP_URL) {
      try {
        await fetch(`${APP_URL}/api/auth/send-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } catch { /* email gönderilemese de kayıt başarılı sayılır */ }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}

function translateError(msg: string): string {
  if (msg.includes("User already registered")) return "Bu e-posta adresi zaten kayıtlı.";
  if (msg.includes("Password should be at least")) return "Şifre en az 6 karakter olmalıdır.";
  if (msg.includes("rate limit")) return "Çok fazla deneme. Lütfen biraz bekleyin.";
  return "Kayıt başarısız. Lütfen tekrar deneyin.";
}
