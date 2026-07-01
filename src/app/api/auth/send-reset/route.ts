import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "E-posta zorunludur." }, { status: 400 });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const supabase = createServiceClient() as Any;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      // Hata döndürmüyoruz — email enumeration'ı önlemek için
      return NextResponse.json({ success: true });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ success: true, method: "supabase" });
    }

    const actionLink = linkData.properties.action_link as string;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mizanım <noreply@mizanim.com>",
        to: [email],
        subject: "Mizanım — Şifre Sıfırlama",
        html: resetEmailHtml(actionLink),
      }),
    });

    return NextResponse.json({ success: true, method: "resend" });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}

function resetEmailHtml(actionLink: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Şifre Sıfırlama — Mizanım</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#0f1729;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">⚖️ Mizanım</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">Şifre Sıfırlama</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#0f1729;font-weight:700;">Şifrenizi Sıfırlayın</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Hesabınız için şifre sıfırlama talep edildi. Yeni şifrenizi belirlemek için
                aşağıdaki butona tıklayın.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${actionLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e7b743);color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
                  Şifreyi Sıfırla
                </a>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Bu bağlantı <strong>1 saat</strong> geçerlidir.</p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Eğer bu talebi siz yapmadıysanız, şifreniz değişmeyecektir. Bu e-postayı görmezden gelebilirsiniz.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">© 2026 Mizanım</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
