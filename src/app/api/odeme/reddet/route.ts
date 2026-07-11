import { createServiceClient } from "@/lib/supabase/server";
import { sendUserRejectedEmail } from "@/lib/email/odeme";
import { odemeSonucSayfasi, htmlResponse } from "@/lib/odeme-sayfa";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Admin mailindeki "Talebi Reddet" linki
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false, baslik: "Geçersiz Bağlantı", mesaj: "Bağlantı eksik veya hatalı.",
    }), 400);
  }

  const svc = createServiceClient() as Any;

  const { data: req } = await svc
    .from("payment_requests")
    .select("id, user_id, package_code, reference_code, status")
    .eq("approval_token", token)
    .single();

  if (!req) {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false, baslik: "Geçersiz Bağlantı", mesaj: "Bu bağlantı sistemde bulunamadı.",
    }), 400);
  }

  if (req.status !== "pending") {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false,
      baslik: "Bağlantı Kullanılmış",
      mesaj: `Bu talep daha önce işlenmiş (${req.status === "approved" ? "onaylandı" : "reddedildi"}).`,
      detay: `Referans: ${req.reference_code}`,
    }), 400);
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
