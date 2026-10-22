// CRM (crm.dravoxai.com) üyelik/ödeme/deneme bildirimleri — Resend üzerinden,
// src/lib/email/odeme.ts'teki kullanıcıya giden mailerden ayrı tutulur.
// Sabit gönderen + her zaman "[Mizanım]" ile başlayan konu: CRM botu bu iki
// bilgiyle filtre uygular, bu yüzden format değiştirilmemeli.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const CRM_FROM = process.env.CRM_EMAIL_FROM ?? "Mizanım <bildirim@mizanim.com>";
const CRM_TO = process.env.CRM_NOTIFICATION_EMAIL ?? "info@dravoxai.com";

async function sendCrmEmail(subject: string, html: string): Promise<string | null> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: CRM_FROM, to: [CRM_TO], subject, html }),
  });
  if (!res.ok) {
    console.error("[email/crm] Resend hatası:", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = (await res.json().catch(() => null)) as Any;
  return data?.id ?? null;
}

function konu(baslik: string, isTest: boolean): string {
  return isTest ? `[Mizanım][TEST] ${baslik}` : `[Mizanım] ${baslik}`;
}

function govde(satirlar: Array<[string, string]>): string {
  const satirHtml = satirlar
    .map(
      ([etiket, deger]) =>
        `<tr><td style="padding:6px 10px;color:#6b7280;">${etiket}</td><td style="padding:6px 10px;font-weight:600;color:#0f1729;">${deger}</td></tr>`
    )
    .join("");
  return `<table cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;">${satirHtml}</table>`;
}

export async function sendCrmYeniUyelikMaili(params: {
  email: string;
  paket: string;
  hesapTipi: string;
  tarih: string;
  isTest: boolean;
}): Promise<string | null> {
  return sendCrmEmail(
    konu(`Yeni üyelik: ${params.paket}`, params.isTest),
    govde([
      ["E-posta", params.email],
      ["Paket", params.paket],
      ["Hesap Tipi", params.hesapTipi],
      ["Tarih", params.tarih],
    ])
  );
}

export async function sendCrmOdemeAlindiMaili(params: {
  email: string;
  paket: string;
  tutar: string;
  tarih: string;
  isTest: boolean;
}): Promise<string | null> {
  return sendCrmEmail(
    konu(`Ödeme alındı: ${params.tutar}`, params.isTest),
    govde([
      ["E-posta", params.email],
      ["Paket", params.paket],
      ["Tutar", params.tutar],
      ["Tarih", params.tarih],
    ])
  );
}

export async function sendCrmDenemeBitiyorMaili(params: {
  email: string;
  paket: string;
  bitisTarihi: string;
  isTest: boolean;
}): Promise<string | null> {
  return sendCrmEmail(
    konu(`Deneme bitiyor: ${params.email}`, params.isTest),
    govde([
      ["E-posta", params.email],
      ["Paket", params.paket],
      ["Bitiş Tarihi", params.bitisTarihi],
    ])
  );
}
