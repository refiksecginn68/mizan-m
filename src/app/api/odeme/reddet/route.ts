import { createServiceClient } from "@/lib/supabase/server";
import { validatePendingRequest, readTokenFromPost } from "@/lib/odeme";
import { sendUserRejectedEmail } from "@/lib/email/odeme";
import { odemeSonucSayfasi, odemeOnayFormSayfasi, htmlResponse } from "@/lib/odeme-sayfa";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// GET: maildeki "Reddet" linki buraya gelir. HİÇBİR ŞEY DEĞİŞTİRMEZ —
// onay/red butonlu aynı özet sayfasını gösterir (Safe Links güvenli).
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const svc = createServiceClient() as Any;

  const { req, hata } = await validatePendingRequest(svc, token);
  if (hata) {
    return htmlResponse(odemeSonucSayfasi({ basarili: false, ...hata }), 400);
  }

  const [{ data: pkg }, { data: profile }] = await Promise.all([
    svc.from("credit_packages").select("name, query_quota").eq("code", req.package_code).single(),
    svc.from("profiles").select("full_name, email").eq("id", req.user_id).single(),
  ]);

  return htmlResponse(odemeOnayFormSayfasi({
    token: req.approval_token,
    kullanici: `${profile?.full_name ?? "Bilinmiyor"} (${profile?.email ?? "-"})`,
    paket: pkg?.name ?? req.package_code,
    tutarTry: req.amount_try,
    referansKodu: req.reference_code,
    kota: pkg?.query_quota ?? 0,
  }), 200);
}

// POST: asıl red işlemi — yalnız sayfadaki Reddet butonundan tetiklenir
export async function POST(request: Request) {
  const token = await readTokenFromPost(request);
  const svc = createServiceClient() as Any;

  const { req, hata } = await validatePendingRequest(svc, token);
  if (hata) {
    return htmlResponse(odemeSonucSayfasi({ basarili: false, ...hata }), 400);
  }

  const { data: updated } = await svc
    .from("payment_requests")
    .update({ status: "rejected", approved_at: new Date().toISOString(), approved_by: "email-red-linki" })
    .eq("id", req.id)
    .eq("status", "pending")
    .select("id")
    .single();

  if (!updated) {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false, baslik: "Bağlantı Kullanılmış", mesaj: "Bu talep az önce başka bir istekle işlendi.",
    }), 400);
  }

  const { data: profile } = await svc
    .from("profiles")
    .select("full_name, email")
    .eq("id", req.user_id)
    .single();

  const { data: pkg } = await svc
    .from("credit_packages")
    .select("name")
    .eq("code", req.package_code)
    .single();

  if (profile?.email) {
    await sendUserRejectedEmail({
      userEmail: profile.email,
      userName: profile.full_name ?? "Kullanıcı",
      packageName: pkg?.name ?? req.package_code,
      referenceCode: req.reference_code,
    });
  }

  return htmlResponse(odemeSonucSayfasi({
    basarili: true,
    baslik: "Talep Reddedildi",
    mesaj: "Talep reddedildi ve kullanıcıya bilgilendirme maili gönderildi.",
    detay: `Referans: ${req.reference_code}`,
  }), 200);
}
