import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userClient = createClient() as any;
  const { data: { user } } = await userClient.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Oturum açmanız gerekiyor" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceClient = createServiceClient() as any;
  const { data: doc } = await serviceClient
    .from("generated_documents")
    .select("id, user_id, title, file_path, content, document_type")
    .eq("id", params.id)
    .single();

  if (!doc) {
    return new Response(JSON.stringify({ error: "Belge bulunamadı" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (doc.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Bu belgeye erişim yetkiniz yok" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Dosya storage'da varsa yönlendir
  if (doc.file_path) {
    redirect(doc.file_path);
  }

  // Storage yoksa içeriği metin dosyası olarak döndür
  const fileName = encodeURIComponent(`${doc.title || "belge"}.txt`);
  return new Response(doc.content ?? "", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
