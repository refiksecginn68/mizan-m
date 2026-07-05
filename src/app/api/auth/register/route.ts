import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, password, user_type, phone, bar_number } = body;

    if (!full_name || !email || !password || !user_type) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
    }

    // signUp yerine admin.createUser: Supabase'in yerleşik SMTP'sine e-posta
    // göndertmez (saatte 2 e-posta limiti kayıt akışını kilitliyordu).
    // Doğrulama e-postası aşağıda Resend üzerinden gönderilir.
    const supabase = createServiceClient() as Any;
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name,
        user_type,
        phone: phone ?? null,
        bar_number: bar_number ?? null,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: translateError(error.message) },
        { status: 400 }
      );
    }

    // Resend ile markalı doğrulama e-postası gönder
    let emailSent = false;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.RESEND_API_KEY && APP_URL) {
      try {
        const res = await fetch(`${APP_URL}/api/auth/send-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        emailSent = res.ok;
      } catch { /* email gönderilemese de kayıt başarılı sayılır */ }
    }

    return NextResponse.json({ success: true, emailSent });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}

function translateError(msg: string): string {
  if (msg.includes("already been registered") || msg.includes("already registered"))
    return "Bu e-posta adresi zaten kayıtlı.";
  if (msg.includes("Password should be at least")) return "Şifre en az 6 karakter olmalıdır.";
  if (msg.includes("invalid")) return "Geçerli bir e-posta adresi girin.";
  if (msg.includes("rate limit")) return "Çok fazla deneme. Lütfen biraz bekleyin.";
  return "Kayıt başarısız. Lütfen tekrar deneyin.";
}
