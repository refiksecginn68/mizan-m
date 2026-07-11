import { createServiceClient } from "@/lib/supabase/server";
import { APPROVAL_TOKEN_TTL_DAYS } from "@/lib/odeme";
import { sendUserApprovedEmail } from "@/lib/email/odeme";
import { odemeSonucSayfasi, htmlResponse } from "@/lib/odeme-sayfa";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Aylık paketler onayda hatırlatma oluşturur; kontörler oluşturmaz
const AYLIK_PAKETLER = ["vatandas", "pro", "max"];

// Admin mailindeki tek tık ONAYLA linki
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false, baslik: "Geçersiz Bağlantı", mesaj: "Onay bağlantısı eksik veya hatalı.",
    }), 400);
  }

  const svc = createServiceClient() as Any;

  const { data: req } = await svc
    .from("payment_requests")
    .select("id, user_id, package_code, amount_try, reference_code, status, created_at")
    .eq("approval_token", token)
    .single();

  if (!req) {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false, baslik: "Geçersiz Bağlantı", mesaj: "Bu onay bağlantısı sistemde bulunamadı.",
    }), 400);
  }

  if (req.status !== "pending") {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false,
      baslik: "Bağlantı Kullanılmış",
      mesaj: `Bu talep daha önce "${req.status === "approved" ? "onaylandı" : "reddedildi"}" olarak işlenmiş.`,
      detay: `Referans: ${req.reference_code}`,
    }), 400);
  }

  const yasMs = Date.now() - new Date(req.created_at).getTime();
  if (yasMs > APPROVAL_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000) {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false,
      baslik: "Bağlantı Süresi Dolmuş",
      mesaj: `Onay bağlantıları ${APPROVAL_TOKEN_TTL_DAYS} gün geçerlidir. Kullanıcıdan yeni talep oluşturmasını isteyin.`,
      detay: `Referans: ${req.reference_code}`,
    }), 400);
  }

  // Tek kullanımlık: status=pending şartıyla güncelle (yarış durumuna karşı)
  const { data: updated } = await svc
    .from("payment_requests")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: "email-onay-linki" })
    .eq("id", req.id)
    .eq("status", "pending")
    .select("id")
    .single();

  if (!updated) {
    return htmlResponse(odemeSonucSayfasi({
      basarili: false, baslik: "Bağlantı Kullanılmış", mesaj: "Bu talep az önce başka bir istekle işlendi.",
    }), 400);
  }

  const { data: pkg } = await svc
    .from("credit_packages")
    .select("code, name, query_quota")
    .eq("code", req.package_code)
    .single();

  const quota: number = pkg?.query_quota ?? 0;

  const { data: profile } = await svc
    .from("profiles")
    .select("full_name, email, additional_queries")
    .eq("id", req.user_id)
    .single();

  const yeniBakiye = (profile?.additional_queries ?? 0) + quota;

  const profilGuncelleme: Record<string, unknown> = { additional_queries: yeniBakiye };
  if (req.package_code === "max") profilGuncelleme.uyap_uets_active = true;

  const { error: updErr } = await svc.from("profiles").update(profilGuncelleme).eq("id", req.user_id);
  if (updErr) {
    console.error("[odeme/onayla] profil güncelleme hatası:", updErr.message);
    return htmlResponse(odemeSonucSayfasi({
      basarili: false,
      baslik: "İşlem Hatası",
      mesaj: "Talep onaylandı ancak kota yüklenemedi. Lütfen manuel kontrol edin.",
      detay: `Referans: ${req.reference_code} · Kullanıcı: ${profile?.email ?? req.user_id}`,
    }), 500);
  }

  await svc.from("credit_transactions").insert({
    user_id: req.user_id,
    amount: quota,
    type: "purchase",
    description: `Havale onayı: ${pkg?.name ?? req.package_code} (${req.reference_code})`,
    payment_request_id: req.id,
  });

  // Aylık paketlerde 30 gün sonrası için hatırlatma kur
  if (AYLIK_PAKETLER.includes(req.package_code)) {
    const nextAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await svc.from("payment_reminders").upsert(
      { user_id: req.user_id, package_code: req.package_code, next_reminder_at: nextAt, active: true },
      { onConflict: "user_id,package_code" }
    );
  }

  if (profile?.email) {
    const userEmailId = await sendUserApprovedEmail({
      userEmail: profile.email,
      userName: profile.full_name ?? "Kullanıcı",
      packageName: pkg?.name ?? req.package_code,
      queryQuota: quota,
      newBalance: yeniBakiye,
    });
    console.log(`[odeme/onayla] ref=${req.reference_code} userEmailId=${userEmailId}`);
  }

  return htmlResponse(odemeSonucSayfasi({
    basarili: true,
    baslik: "Ödeme Onaylandı",
    mesaj: `${profile?.full_name ?? "Kullanıcı"} hesabına ${quota.toLocaleString("tr-TR")} sorgu yüklendi. Kullanıcıya bilgilendirme maili gönderildi.`,
    detay: `Referans: ${req.reference_code} · Yeni ek sorgu bakiyesi: ${yeniBakiye.toLocaleString("tr-TR")}`,
  }), 200);
}
