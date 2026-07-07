import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// IP başına dakikada en fazla 3 mesaj
const RATE_LIMIT_PER_MINUTE = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

    const { adSoyad, email, konu, mesaj, website } = body as {
      adSoyad?: string; email?: string; konu?: string; mesaj?: string; website?: string;
    };

    // Honeypot: gerçek kullanıcı bu alanı doldurmaz — botsa sessizce "başarılı" dön
    if (website) return NextResponse.json({ success: true });

    // Sunucu tarafı doğrulama
    if (!adSoyad?.trim() || !email?.trim() || !konu?.trim() || !mesaj?.trim()) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi giriniz." }, { status: 400 });
    }
    if (mesaj.length > 5000 || konu.length > 200 || adSoyad.length > 120) {
      return NextResponse.json({ error: "Mesaj çok uzun." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const supabase = createServiceClient() as Any;

    // Basit rate limit: aynı IP'den son 1 dakikadaki mesaj sayısı
    if (ip) {
      const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
      const { count } = await supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("created_at", oneMinuteAgo);
      if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
        return NextResponse.json(
          { error: "Çok sık mesaj gönderdiniz. Lütfen bir dakika sonra tekrar deneyin." },
          { status: 429 }
        );
      }
    }

    // Birincil kayıt: DB'ye yaz — mesaj asla kaybolmaz
    const { error: dbError } = await supabase.from("contact_messages").insert({
      ad_soyad: adSoyad.trim(),
      email: email.trim(),
      konu: konu.trim(),
      mesaj: mesaj.trim(),
      ip,
    });

    if (dbError) {
      console.error("İletişim mesajı kaydedilemedi:", dbError);
      return NextResponse.json(
        { error: "Mesajınız iletilemedi. Lütfen tekrar deneyin veya bizi telefonla arayın." },
        { status: 500 }
      );
    }

    // Bildirim maili (ikincil — başarısız olsa da mesaj DB'de, "iletildi" sayılır)
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      const notifyTo = process.env.CONTACT_NOTIFY_EMAIL ?? "refiksecginn@gmail.com";
      if (RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Fallback, Resend'de doğrulanan punycode domain ile birebir eşleşmeli
            from: process.env.EMAIL_FROM ?? "Mizanım <noreply@xn--mizanm-t9a.com>",
            to: [notifyTo],
            reply_to: email.trim(),
            subject: `Yeni iletişim mesajı: ${konu.trim()}`,
            html: notificationHtml(adSoyad.trim(), email.trim(), konu.trim(), mesaj.trim()),
          }),
        });
      }
    } catch (e) {
      console.error("İletişim bildirim maili gönderilemedi:", e);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function notificationHtml(adSoyad: string, email: string, konu: string, mesaj: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr><td style="background:#0f1729;padding:20px 24px;">
      <p style="margin:0;font-size:18px;font-weight:800;color:#ffffff;">Mizanım — Yeni İletişim Mesajı</p>
    </td></tr>
    <tr><td style="padding:24px;">
      <p style="margin:0 0 6px;font-size:14px;color:#0f1729;"><strong>Ad Soyad:</strong> ${escapeHtml(adSoyad)}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#0f1729;"><strong>E-posta:</strong> ${escapeHtml(email)}</p>
      <p style="margin:0 0 16px;font-size:14px;color:#0f1729;"><strong>Konu:</strong> ${escapeHtml(konu)}</p>
      <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;border-left:3px solid #c9a84c;padding-left:12px;">${escapeHtml(mesaj)}</p>
    </td></tr>
  </table>
</body>
</html>`;
}
