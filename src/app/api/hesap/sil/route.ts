import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Hesabı kalıcı siler (KVKK silme hakkı). Onay metni zorunlu.
export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { onay?: string };
  if (body.onay !== "HESABIMI SİL") {
    return NextResponse.json({ error: "Onay metni hatalı" }, { status: 400 });
  }

  const svc = createServiceClient() as Any;

  // Storage'daki dosyalar auth.users silinince OTOMATİK silinmez (ON DELETE CASCADE
  // yalnızca public şemasındaki tabloları kapsar, storage.objects ayrı bir sistemdir).
  // KVKK "derhal imha" taahhüdü için burada açıkça toplanıp silinir.
  const [{ data: caseDocs }, { data: docs }, { data: genDocs }] = await Promise.all([
    svc.from("case_documents").select("storage_path").eq("lawyer_id", user.id),
    svc.from("documents").select("storage_path").eq("user_id", user.id),
    svc.from("generated_documents").select("pdf_path, docx_path").eq("user_id", user.id),
  ]);
  const paths: string[] = [
    ...(caseDocs ?? []).map((d: { storage_path: string | null }) => d.storage_path),
    ...(docs ?? []).map((d: { storage_path: string | null }) => d.storage_path),
    ...(genDocs ?? []).flatMap((d: { pdf_path: string | null; docx_path: string | null }) => [d.pdf_path, d.docx_path]),
  ].filter((p): p is string => !!p);

  if (paths.length > 0) {
    const { error: storageErr } = await svc.storage.from("documents").remove(paths);
    if (storageErr) console.error("[hesap/sil] storage temizliği hatalı:", storageErr.message);
  }

  const { error } = await svc.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[hesap/sil] kullanıcı silinemedi:", error.message);
    return NextResponse.json({ error: "Hesap silinemedi. Lütfen destek ile iletişime geçin." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
