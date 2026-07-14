// Ödeme sistemi e-posta şablonları ve gönderim yardımcıları (Resend)

const FROM = process.env.EMAIL_FROM ?? "Mizanım <noreply@xn--mizanm-t9a.com>";
// Admin bildirimleri iki adrese birden gider (teslimat yedekliliği)
const ADMIN_EMAILS = Array.from(new Set([
  process.env.MIZANIM_ADMIN_EMAIL ?? "refiksecginn@hotmail.com",
  "refiksecginn@gmail.com",
]));
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://xn--mizanm-t9a.com";

// IBAN gizli değil; env bağımlılığı prod'da "IBAN tanımlanmadı" hatasına yol
// açtığı için varsayılanlar kodda sabitlendi (env yine de öncelikli).
export function getIbanBilgi() {
  return {
    iban: process.env.NEXT_PUBLIC_MIZANIM_IBAN ?? "TR85 0015 7000 0000 0102 7794 97",
    hesapAdi: process.env.NEXT_PUBLIC_MIZANIM_HESAP_ADI ?? "REFİK SEÇGİN",
  };
}

async function sendEmail(to: string | string[], subject: string, html: string): Promise<string | null> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html }),
  });
  if (!res.ok) {
    console.error("[email/odeme] Resend hatası:", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = await res.json().catch(() => null) as { id?: string } | null;
  return data?.id ?? null;
}

function wrap(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title} — Mizanım</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f1729;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Mizanım</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">Hukuki süreçlerinizi AI ile kolaylaştırın</p>
          </td>
        </tr>
        <tr><td style="padding:36px 32px;">${bodyHtml}</td></tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              <a href="https://xn--mizanm-t9a.com" style="color:#c9a84c;text-decoration:none;">mizanım.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#0f1729;font-weight:600;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`;
}

// Admin'e: kullanıcı ödeme bildirimi (dekont) gönderdi + Onay/Red sayfası linkleri.
// Onay/Red mutasyonu GET'te DEĞİL — linkler yalnız form sayfası açar, işlem POST ile yapılır
// (Safe Links / mail tarayıcı botlarına karşı).
export async function sendAdminPaymentRequestEmail(params: {
  userEmail: string;
  userName: string;
  packageName: string;
  amountTry: number;
  referenceCode: string;
  approvalToken: string;
  receiptNo?: string | null;
  payerNote?: string | null;
  bildirimTarihi?: string;
}): Promise<string | null> {
  const onaylaUrl = `${APP_URL}/api/odeme/onayla?token=${params.approvalToken}`;
  const reddetUrl = `${APP_URL}/api/odeme/reddet?token=${params.approvalToken}`;
  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#0f1729;font-weight:600;">Yeni Ödeme Bildirimi</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
      Aşağıdaki kullanıcı havale/EFT ödemesini yaptığını bildirdi. Ödemeyi hesabınızda
      kontrol edip onay sayfasından işlemi tamamlayın.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;margin:0 0 24px;">
      ${infoRow("Ödeyen", params.userName)}
      ${infoRow("E-posta", params.userEmail)}
      ${infoRow("Paket", params.packageName)}
      ${infoRow("Tutar", `₺${params.amountTry.toLocaleString("tr-TR")}`)}
      ${infoRow("Dekont No", `<span style="color:#0f1729;">${params.receiptNo ?? "— (henüz bildirilmedi)"}</span>`)}
      ${infoRow("Bildirim Tarihi", params.bildirimTarihi ?? "—")}
      ${infoRow("Referans Kodu", `<span style="color:#c9a84c;">${params.referenceCode}</span>`)}
      ${params.payerNote ? infoRow("Açıklama", params.payerNote) : ""}
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="${onaylaUrl}"
         style="display:inline-block;background:#c9a84c;color:#ffffff;font-weight:700;font-size:15px;padding:14px 44px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
        Onay Sayfasını Aç
      </a>
    </div>
    <p style="margin:0;text-align:center;font-size:13px;color:#9ca3af;">
      Ödeme gelmezse: <a href="${reddetUrl}" style="color:#dc2626;text-decoration:underline;">Red Sayfasını Aç</a>
    </p>`;
  return sendEmail(
    ADMIN_EMAILS,
    `Mizanım — Ödeme Bildirimi: ${params.referenceCode}${params.receiptNo ? ` · Dekont ${params.receiptNo}` : ""} (₺${params.amountTry.toLocaleString("tr-TR")})`,
    wrap("Ödeme Bildirimi", body)
  );
}

// Admin'e: yeni kullanıcı kaydı bildirimi
export async function sendAdminNewUserEmail(params: {
  fullName: string;
  email: string;
  userType: string;
}): Promise<string | null> {
  const tarih = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#0f1729;font-weight:600;">Yeni Kayıt</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;">
      ${infoRow("Ad Soyad", params.fullName)}
      ${infoRow("E-posta", params.email)}
      ${infoRow("Kullanıcı Tipi", params.userType)}
      ${infoRow("Tarih", tarih)}
    </table>`;
  return sendEmail(ADMIN_EMAILS, `Mizanım — Yeni kayıt: ${params.fullName}`, wrap("Yeni Kayıt", body));
}

// Kullanıcıya: kredi yüklendi (onay sonrası)
export async function sendUserApprovedEmail(params: {
  userEmail: string;
  userName: string;
  packageName: string;
  queryQuota: number;
  newBalance: number;
}): Promise<string | null> {
  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#0f1729;font-weight:600;">Sayın ${params.userName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
      Ödemeniz onaylandı ve sorgu krediniz hesabınıza tanımlandı.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;margin:0 0 24px;">
      ${infoRow("Paket", params.packageName)}
      ${infoRow("Yüklenen Kota", `+${params.queryQuota.toLocaleString("tr-TR")} sorgu`)}
      ${infoRow("Yeni Ek Sorgu Bakiyesi", `${params.newBalance.toLocaleString("tr-TR")} sorgu`)}
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/kredi"
         style="display:inline-block;background:#c9a84c;color:#ffffff;font-weight:700;font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none;">
        Bakiyemi Görüntüle
      </a>
    </div>
    <p style="margin:16px 0 0;font-size:14px;color:#0f1729;">Saygılarımızla,<br/><strong>Mizanım Ekibi</strong></p>`;
  return sendEmail(params.userEmail, "Mizanım — Krediniz Yüklendi", wrap("Krediniz Yüklendi", body));
}

// Kullanıcıya: talep reddedildi
export async function sendUserRejectedEmail(params: {
  userEmail: string;
  userName: string;
  packageName: string;
  referenceCode: string;
}): Promise<string | null> {
  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#0f1729;font-weight:600;">Sayın ${params.userName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
      <strong>${params.referenceCode}</strong> referans kodlu <strong>${params.packageName}</strong> paket talebiniz için
      ödeme hesabımıza ulaşmadığından talep iptal edilmiştir. Havaleyi yaptıysanız lütfen dekontla birlikte bize ulaşın.
    </p>
    <p style="margin:16px 0 0;font-size:14px;color:#0f1729;">Saygılarımızla,<br/><strong>Mizanım Ekibi</strong></p>`;
  return sendEmail(params.userEmail, "Mizanım — Ödeme Talebiniz Hakkında", wrap("Ödeme Talebiniz", body));
}

// Kullanıcıya: aylık havale hatırlatması (yeni referans kodu ile)
export async function sendReminderEmail(params: {
  userEmail: string;
  userName: string;
  packageName: string;
  amountTry: number;
  referenceCode: string;
}): Promise<string | null> {
  const { iban, hesapAdi } = getIbanBilgi();
  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#0f1729;font-weight:600;">Sayın ${params.userName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
      <strong>${params.packageName}</strong> paketinizin aylık yenileme zamanı geldi.
      Kesintisiz kullanım için aşağıdaki hesaba havale/EFT yapabilirsiniz.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;margin:0 0 24px;">
      ${infoRow("Hesap Adı", hesapAdi)}
      ${infoRow("IBAN", iban)}
      ${infoRow("Tutar", `₺${params.amountTry.toLocaleString("tr-TR")}`)}
      ${infoRow("Referans Kodu", `<span style="color:#c9a84c;">${params.referenceCode}</span>`)}
    </table>
    <p style="margin:0 0 20px;font-size:13px;color:#dc2626;">
      Önemli: Havale/EFT açıklamasına mutlaka referans kodunuzu yazın.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/kredi-yukle"
         style="display:inline-block;background:#c9a84c;color:#ffffff;font-weight:700;font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none;">
        Kredi Yükleme Sayfası
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Hatırlatmaları <a href="${APP_URL}/kredi-yukle" style="color:#c9a84c;">kredi yükleme sayfasından</a> kapatabilirsiniz.
    </p>`;
  return sendEmail(
    params.userEmail,
    `Mizanım — ${params.packageName} Aylık Yenileme Hatırlatması`,
    wrap("Aylık Yenileme", body)
  );
}
