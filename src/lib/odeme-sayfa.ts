// Onay/red endpoint'lerinin döndürdüğü basit markalı HTML sayfaları

export function odemeSonucSayfasi(params: {
  basarili: boolean;
  baslik: string;
  mesaj: string;
  detay?: string;
}): string {
  const renk = params.basarili ? "#16a34a" : "#dc2626";
  const ikon = params.basarili ? "&#10003;" : "&#10005;";
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${params.baslik} — Mizanım</title>
</head>
<body style="margin:0;padding:0;background:#0f1729;font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="background:#ffffff;border-radius:16px;padding:48px 40px;max-width:440px;margin:24px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.3);">
    <div style="width:64px;height:64px;border-radius:50%;background:${renk}1a;color:${renk};font-size:32px;line-height:64px;margin:0 auto 20px;">${ikon}</div>
    <h1 style="margin:0 0 12px;font-size:22px;color:#0f1729;">${params.baslik}</h1>
    <p style="margin:0 0 8px;font-size:15px;color:#6b7280;line-height:1.7;">${params.mesaj}</p>
    ${params.detay ? `<p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">${params.detay}</p>` : ""}
    <p style="margin:28px 0 0;font-size:13px;"><a href="https://mizanim.com" style="color:#c9a84c;text-decoration:none;font-weight:600;">mizanim.com</a></p>
  </div>
</body>
</html>`;
}

// GET onay/red sayfası: hiçbir şey değiştirmez, özet + POST formları gösterir.
// Mutasyon yalnız POST'ta — mail tarayıcıları (Safe Links) GET'i güvenle ziyaret edebilir.
export function odemeOnayFormSayfasi(params: {
  token: string;
  kullanici: string;
  paket: string;
  tutarTry: number;
  referansKodu: string;
  kota: number;
}): string {
  const satir = (l: string, v: string) =>
    `<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;text-align:left;">${l}</td>
     <td style="padding:8px 12px;font-size:13px;color:#0f1729;font-weight:600;border-bottom:1px solid #f3f4f6;text-align:right;">${v}</td></tr>`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>Ödeme Talebi Onayı — Mizanım</title>
</head>
<body style="margin:0;padding:0;background:#0f1729;font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="background:#ffffff;border-radius:16px;padding:40px;max-width:460px;margin:24px;box-shadow:0 8px 40px rgba(0,0,0,0.3);">
    <h1 style="margin:0 0 6px;font-size:20px;color:#0f1729;text-align:center;">Ödeme Talebi</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#6b7280;text-align:center;line-height:1.6;">
      Havale hesaba düştüyse onaylayın. Bu sayfa görüntülendiğinde hiçbir işlem yapılmaz.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;margin:0 0 24px;">
      ${satir("Kullanıcı", params.kullanici)}
      ${satir("Paket", params.paket)}
      ${satir("Tutar", `₺${params.tutarTry.toLocaleString("tr-TR")}`)}
      ${satir("Yüklenecek Kota", `${params.kota.toLocaleString("tr-TR")} sorgu`)}
      ${satir("Referans Kodu", `<span style="color:#c9a84c;">${params.referansKodu}</span>`)}
    </table>
    <form method="POST" action="/api/odeme/onayla" style="margin:0 0 12px;">
      <input type="hidden" name="token" value="${params.token}" />
      <button type="submit" style="width:100%;background:#c9a84c;color:#ffffff;font-weight:700;font-size:15px;padding:14px;border:none;border-radius:10px;cursor:pointer;letter-spacing:0.3px;">
        ONAYLA — Kotayı Yükle
      </button>
    </form>
    <form method="POST" action="/api/odeme/reddet" style="margin:0;">
      <input type="hidden" name="token" value="${params.token}" />
      <button type="submit" style="width:100%;background:#ffffff;color:#dc2626;font-weight:600;font-size:13px;padding:12px;border:1px solid #fecaca;border-radius:10px;cursor:pointer;">
        Reddet (ödeme gelmedi)
      </button>
    </form>
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      <a href="https://mizanim.com" style="color:#c9a84c;text-decoration:none;">mizanim.com</a>
    </p>
  </div>
</body>
</html>`;
}

export function htmlResponse(html: string, status: number): Response {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
