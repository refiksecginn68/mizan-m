import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendAdminNewUserEmail } from "@/lib/email/odeme";
import { getLatestLegalDoc } from "@/lib/legal/content";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface AcikRiza {
  ozel_nitelikli?: boolean;
  medya_analizi?: boolean;
  ticari_ileti?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, password, user_type, phone, bar_number, acik_riza } = body as {
      full_name: string; email: string; password: string; user_type: "avukat" | "vatandas";
      phone?: string; bar_number?: string; acik_riza?: AcikRiza;
    };

    if (!full_name || !email || !password || !user_type) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
    }

    // signUp yerine admin.createUser: Supabase'in yerleşik SMTP'sine e-posta
    // göndertmez (saatte 2 e-posta limiti kayıt akışını kilitliyordu).
    // Doğrulama e-postası aşağıda Resend üzerinden gönderilir.
    const supabase = createServiceClient() as Any;
    const { data: created, error } = await supabase.auth.admin.createUser({
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

    // Sözleşme/KVKK onay kayıtları — ispat amaçlı, hesap silinse de saklanır (bkz. Saklama ve İmha Politikası)
    try {
      const userId: string | undefined = created?.user?.id;
      if (userId) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
        const ua = request.headers.get("user-agent") ?? null;
        const kullanimSlug = user_type === "avukat" ? "kullanim-kosullari-avukat" : "kullanim-kosullari-vatandas";
        const kvkkSlug = user_type === "avukat" ? "kvkk-aydinlatma-avukat" : "kvkk-aydinlatma-vatandas";
        const rows = [
          { slug: kullanimSlug, granted: true },
          { slug: "gizlilik-politikasi", granted: true },
          { slug: kvkkSlug, granted: true },
          { slug: "acik-riza-metni:ozel-nitelikli", granted: !!acik_riza?.ozel_nitelikli },
          { slug: "acik-riza-metni:medya-analizi", granted: !!acik_riza?.medya_analizi },
          { slug: "acik-riza-metni:ticari-ileti", granted: !!acik_riza?.ticari_ileti },
        ].map((r) => {
          const baseSlug = r.slug.split(":")[0];
          const doc = getLatestLegalDoc(baseSlug);
          return {
            user_id: userId,
            email,
            slug: r.slug,
            version: doc?.frontmatter.versiyon ?? "v1",
            granted: r.granted,
            ip_address: ip,
            user_agent: ua,
          };
        });
        const { error: consentErr } = await supabase.from("legal_consents").insert(rows);
        if (consentErr) console.error("[register] onay kaydı yazılamadı:", consentErr.message);
      }
    } catch (e) {
      console.error("[register] onay kaydı istisnası:", e);
    }

    // Admin'e yeni kayıt bildirimi (ikincil — başarısız olsa da kayıt başarılı sayılır)
    try {
      const notifyId = await sendAdminNewUserEmail({ fullName: full_name, email, userType: user_type });
      console.log("[register] Admin bildirim maili:", notifyId ?? "GÖNDERİLEMEDİ");
    } catch (e) {
      console.error("Yeni kayıt bildirim maili gönderilemedi:", e);
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
