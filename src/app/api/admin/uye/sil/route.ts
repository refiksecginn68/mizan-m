import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Admin panelinden üye hesabı silme. auth.admin.deleteUser SQL'den çağrılamaz
// (Supabase Admin API'ye özel) — bu yüzden RPC değil, service-role API route.
// Yetki kontrolü SESSION client ile yapılır (service_role ile DEĞİL): admin
// olmayan biri service_role'e hiç ulaşamaz, kontrol burada bilinçli olarak
// önce session üzerinden.
export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!caller?.is_admin) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

  const body = await request.json().catch(() => null) as { userId?: string } | null;
  if (!body?.userId) return NextResponse.json({ error: "userId zorunludur" }, { status: 400 });
  if (body.userId === user.id) return NextResponse.json({ error: "Kendi hesabınızı buradan silemezsiniz" }, { status: 400 });

  const svc = createServiceClient() as Any;
  const targetId = body.userId;

  // KVKK "derhal imha": storage.objects auth.users silinince otomatik silinmez.
  const [{ data: caseDocs }, { data: docs }, { data: genDocs }] = await Promise.all([
    svc.from("case_documents").select("storage_path").eq("lawyer_id", targetId),
    svc.from("documents").select("storage_path").eq("user_id", targetId),
    svc.from("generated_documents").select("pdf_path, docx_path").eq("user_id", targetId),
  ]);
  const paths: string[] = [
    ...(caseDocs ?? []).map((d: { storage_path: string | null }) => d.storage_path),
    ...(docs ?? []).map((d: { storage_path: string | null }) => d.storage_path),
    ...(genDocs ?? []).flatMap((d: { pdf_path: string | null; docx_path: string | null }) => [d.pdf_path, d.docx_path]),
  ].filter((p): p is string => !!p);
  if (paths.length > 0) {
    await svc.storage.from("documents").remove(paths).catch(() => {});
  }

  const { error } = await svc.auth.admin.deleteUser(targetId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
