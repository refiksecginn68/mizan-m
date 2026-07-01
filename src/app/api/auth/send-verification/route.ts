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
      // Resend key yoksa Supabase native email kullan
      const supabase = createServiceClient() as Any;
      await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
      });
      return NextResponse.json({ success: true, method: "supabase" });
    }

    // Supabase'den doğrulama linki al
    const supabase = createServiceClient() as Any;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: "Bağlantı oluşturulamadı." }, { status: 500 });
    }

    const actionLink = linkData.properties.action_link as string;

    // Resend ile Mizanım markalı email gönder
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mizanım <noreply@mizanim.com>",
        to: [email],
        subject: "Mizanım'a Hoş Geldiniz — E-postanızı Doğrulayın",
        html: verificationEmailHtml(actionLink),
      }),
    });

    if (!emailRes.ok) {
      return NextResponse.json({ error: "E-posta gönderilemedi." }, { status: 500 });
    }

    return NextResponse.json({ success: true, method: "resend" });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}

function verificationEmailHtml(actionLink: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-postanızı Doğrulayın — Mizanım</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f1729;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">⚖️ Mizanım</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">Hukuki süreçlerinizi AI ile kolaylaştırın</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#0f1729;font-weight:700;">E-postanızı Doğrulayın</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Mizanım'a kayıt olduğunuz için teşekkürler. Hesabınızı aktifleştirmek için
                aşağıdaki butona tıklayın.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${actionLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e7b743);color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
                  E-postamı Doğrula
                </a>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                Veya aşağıdaki bağlantıyı tarayıcınıza yapıştırın:
              </p>
              <p style="margin:0;font-size:12px;color:#c9a84c;word-break:break-all;">
                ${actionLink}
              </p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Bu bağlantı <strong>24 saat</strong> geçerlidir. Eğer bu kaydı siz yapmadıysanız
                bu e-postayı güvenle görmezden gelebilirsiniz.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                ⚠️ Mizanım hukuki bilgi sunar, hukuki tavsiye niteliği taşımaz.<br/>
                © 2026 Mizanım — <a href="https://mizanim.com/gizlilik-politikasi" style="color:#c9a84c;">Gizlilik</a>
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
