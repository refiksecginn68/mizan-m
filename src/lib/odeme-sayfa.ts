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

export function htmlResponse(html: string, status: number): Response {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
