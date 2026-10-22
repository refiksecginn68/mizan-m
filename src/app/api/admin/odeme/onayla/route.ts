import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendUserApprovedEmail } from "@/lib/email/odeme";
import { sendCrmOdemeAlindiMaili } from "@/lib/email/crm";
import { crmBildirimGonder } from "@/lib/crm-bildirim";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Admin panelinden onay: RPC (session-bağlı, service_role DEĞİL) admin'i
// kendi is_admin bayrağıyla doğrular; bu route sadece sonucu alıp mail atar.
export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const body = await request.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id zorunludur" }, { status: 400 });

  const { data, error } = await supabase.rpc("admin_odeme_onayla", { p_id: body.id });
  if (error || !data?.ok) {
    return NextResponse.json({ error: error?.message ?? data?.error ?? "Onay başarısız" }, { status: 400 });
  }

  const svc = createServiceClient() as Any;
  const [{ data: profile }, { data: pkg }, { data: odemeTalebi }] = await Promise.all([
    svc.from("profiles").select("full_name, email, is_test_account").eq("id", data.user_id).single(),
    svc.from("credit_packages").select("name").eq("code", data.package_code).single(),
    svc.from("payment_requests").select("amount_try").eq("id", body.id).single(),
  ]);

  if (profile?.email) {
    await sendUserApprovedEmail({
      userEmail: profile.email,
      userName: profile.full_name ?? "Kullanıcı",
      packageName: pkg?.name ?? data.package_code,
      queryQuota: data.quota,
      newBalance: data.yeni_bakiye,
    });

    // CRM'e ödeme alındı bildirimi — tek sefer garantili (payment_requests.id idempotency key)
    await crmBildirimGonder(svc, "odeme_alindi", body.id, data.user_id, () =>
      sendCrmOdemeAlindiMaili({
        email: profile.email,
        paket: pkg?.name ?? data.package_code,
        tutar: `₺${Number(odemeTalebi?.amount_try ?? 0).toLocaleString("tr-TR")}`,
        tarih: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
        isTest: !!profile.is_test_account,
      })
    );
  }

  return NextResponse.json({ ok: true });
}
