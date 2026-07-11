import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createPaymentRequest } from "@/lib/odeme";
import { sendReminderEmail, sendAdminPaymentRequestEmail } from "@/lib/email/odeme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Günlük çalışır: vadesi gelen aktif hatırlatmalara yenileme maili atar,
// yeni referans kodlu pending talep oluşturur, vadeyi 30 gün öteler.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const svc = createServiceClient() as Any;
  const now = new Date().toISOString();

  const { data: reminders } = await svc
    .from("payment_reminders")
    .select("id, user_id, package_code, next_reminder_at")
    .eq("active", true)
    .lte("next_reminder_at", now)
    .limit(100);

  const sonuclar: Array<{ reminderId: string; ok: boolean; detay: string }> = [];

  for (const reminder of reminders ?? []) {
    try {
      const [{ data: profile }, { data: pkg }] = await Promise.all([
        svc.from("profiles").select("full_name, email").eq("id", reminder.user_id).single(),
        svc.from("credit_packages").select("code, name, price_try").eq("code", reminder.package_code).single(),
      ]);

      if (!profile?.email || !pkg) {
        sonuclar.push({ reminderId: reminder.id, ok: false, detay: "profil/paket bulunamadı" });
        continue;
      }

      const amountTry = Math.round(Number(pkg.price_try));
      const req = await createPaymentRequest(svc, reminder.user_id, pkg.code, amountTry);
      if (!req) {
        sonuclar.push({ reminderId: reminder.id, ok: false, detay: "talep oluşturulamadı" });
        continue;
      }

      const emailId = await sendReminderEmail({
        userEmail: profile.email,
        userName: profile.full_name ?? "Kullanıcı",
        packageName: pkg.name,
        amountTry,
        referenceCode: req.reference_code,
      });

      // Admin de onay linkini şimdiden alır (ödeme düşünce tek tık onay)
      await sendAdminPaymentRequestEmail({
        userEmail: profile.email,
        userName: profile.full_name ?? "Bilinmiyor",
        packageName: `${pkg.name} (aylık yenileme)`,
        amountTry,
        referenceCode: req.reference_code,
        approvalToken: req.approval_token,
      });

      const nextAt = new Date(
        new Date(reminder.next_reminder_at).getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      await svc.from("payment_reminders").update({ next_reminder_at: nextAt }).eq("id", reminder.id);

      sonuclar.push({ reminderId: reminder.id, ok: emailId !== null, detay: `ref=${req.reference_code} emailId=${emailId}` });
    } catch (e) {
      sonuclar.push({ reminderId: reminder.id, ok: false, detay: String(e) });
    }
  }

  return NextResponse.json({ processed: sonuclar.length, sonuclar });
}
