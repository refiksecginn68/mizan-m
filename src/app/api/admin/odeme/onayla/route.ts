import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendUserApprovedEmail } from "@/lib/email/odeme";

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
  const [{ data: profile }, { data: pkg }] = await Promise.all([
    svc.from("profiles").select("full_name, email").eq("id", data.user_id).single(),
    svc.from("credit_packages").select("name").eq("code", data.package_code).single(),
  ]);

  if (profile?.email) {
    await sendUserApprovedEmail({
      userEmail: profile.email,
      userName: profile.full_name ?? "Kullanıcı",
      packageName: pkg?.name ?? data.package_code,
      queryQuota: data.quota,
      newBalance: data.yeni_bakiye,
    });
  }

  return NextResponse.json({ ok: true });
}
