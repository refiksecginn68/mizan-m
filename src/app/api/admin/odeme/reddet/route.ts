import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendUserRejectedEmail } from "@/lib/email/odeme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const body = await request.json().catch(() => null) as { id?: string; sebep?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id zorunludur" }, { status: 400 });

  const { data, error } = await supabase.rpc("admin_odeme_reddet", { p_id: body.id, p_sebep: body.sebep ?? null });
  if (error || !data?.ok) {
    return NextResponse.json({ error: error?.message ?? data?.error ?? "Red başarısız" }, { status: 400 });
  }

  const svc = createServiceClient() as Any;
  const [{ data: profile }, { data: req }] = await Promise.all([
    svc.from("profiles").select("full_name, email").eq("id", data.user_id).single(),
    svc.from("payment_requests").select("package_code").eq("reference_code", data.reference_code).single(),
  ]);
  const { data: pkg } = req?.package_code
    ? await svc.from("credit_packages").select("name").eq("code", req.package_code).single()
    : { data: null };

  if (profile?.email) {
    await sendUserRejectedEmail({
      userEmail: profile.email,
      userName: profile.full_name ?? "Kullanıcı",
      packageName: pkg?.name ?? req?.package_code ?? "",
      referenceCode: data.reference_code,
    });
  }

  return NextResponse.json({ ok: true });
}
