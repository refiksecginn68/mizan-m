import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Dava belgesini indir (imzalı URL'ye yönlendirir)
export async function GET(_request: Request, { params }: { params: { docId: string } }) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data: doc } = await svc
    .from("case_documents")
    .select("id, lawyer_id, name, storage_path")
    .eq("id", params.docId)
    .single();

  if (!doc) return Response.json({ error: "Belge bulunamadı" }, { status: 404 });
  if (doc.lawyer_id !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
  if (!doc.storage_path) return Response.json({ error: "Bu kayıt bir dosya içermiyor" }, { status: 404 });

  const { data: signed, error } = await svc.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 300, { download: doc.name });

  if (error || !signed?.signedUrl) {
    console.error("Signed URL error:", error);
    return Response.json({ error: "İndirme bağlantısı oluşturulamadı" }, { status: 500 });
  }

  return Response.redirect(signed.signedUrl, 302);
}

// Belge sil
export async function DELETE(_request: Request, { params }: { params: { docId: string } }) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data: doc } = await svc
    .from("case_documents")
    .select("id, lawyer_id, storage_path")
    .eq("id", params.docId)
    .single();

  if (!doc) return Response.json({ error: "Belge bulunamadı" }, { status: 404 });
  if (doc.lawyer_id !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });

  if (doc.storage_path) {
    await svc.storage.from("documents").remove([doc.storage_path]).catch(() => {});
  }
  await svc.from("case_documents").delete().eq("id", params.docId);

  return Response.json({ success: true });
}
