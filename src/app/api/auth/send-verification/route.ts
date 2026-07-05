import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "E-posta zorunludur." }, { status: 400 });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "E-posta servisi yapılandırılmamış." }, { status: 500 });
    }

    // Supabase'den doğrulama tokenı al (magiclink: mevcut kullanıcı için şifresiz
    // üretilir; tıklanınca e-posta doğrulanmış sayılır)
    const supabase = createServiceClient() as Any;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const hashedToken = linkData?.properties?.hashed_token as string | undefined;
    if (linkError || !hashedToken) {
      return NextResponse.json({ error: "Bağlantı oluşturulamadı." }, { status: 500 });
    }

    // Supabase'in action_link'i tokenları URL hash'inde (#access_token) döndürür ve
    // sunucu tarafı callback bunu göremez. Bunun yerine token_hash ile kendi
    // callback'imize yönlendirip sunucuda verifyOtp yapıyoruz.
    const actionLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${hashedToken}&type=email`;

    // Resend ile Mizanım markalı email gönder
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Mizanım <noreply@mizanim.com>",
        to: [email],
        subject: "Mizanım — E-posta Adresinizi Doğrulayın",
        html: verificationEmailHtml(actionLink),
      }),
    });

    if (!emailRes.ok) {
      return NextResponse.json({ error: "E-posta gönderilemedi." }, { status: 500 });
    }

    const emailData = await emailRes.json().catch(() => null) as { id?: string } | null;
    return NextResponse.json({ success: true, method: "resend", emailId: emailData?.id ?? null });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}

function verificationEmailHtml(actionLink: string, fullName?: string): string {
  const greeting = fullName ? `Sayın ${fullName},` : "Sayın Kullanıcı,";
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-posta Adresinizi Doğrulayın — Mizanım</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#0f1729;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Mizanım</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">Hukuki süreçlerinizi AI ile kolaylaştırın</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#0f1729;font-weight:600;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;">
                Mizanım'a hoş geldiniz. Hesabınızı aktif etmek için aşağıdaki butona tıklayınız.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${actionLink}"
                   style="display:inline-block;background:#c9a84c;color:#ffffff;font-weight:700;font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                  E-postayı Doğrula
                </a>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                Veya aşağıdaki bağlantıyı tarayıcınıza yapıştırın:
              </p>
              <p style="margin:0;font-size:12px;color:#c9a84c;word-break:break-all;">
                ${actionLink}
              </p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;" />
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                Bu işlemi siz yapmadıysanız bu maili dikkate almayınız.
              </p>
              <p style="margin:16px 0 0;font-size:14px;color:#0f1729;">
                Saygılarımızla,<br/>
                <strong>Mizanım Ekibi</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                <a href="https://mizanim.com" style="color:#c9a84c;text-decoration:none;">mizanim.com</a>
                &nbsp;|&nbsp;
                <a href="mailto:info@mizanim.com" style="color:#c9a84c;text-decoration:none;">info@mizanim.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
