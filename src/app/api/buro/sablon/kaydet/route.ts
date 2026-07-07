import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, document_type } = await request.json() as {
    title: string;
    content: string;
    document_type: string;
  };

  if (!title?.trim() || !content?.trim()) {
    return Response.json({ error: "Başlık ve içerik gereklidir" }, { status: 400 });
  }

  const serviceSupabase = createServiceClient() as Any;
  const { data, error } = await serviceSupabase.from("generated_documents").insert({
    user_id: user.id,
    title: title.slice(0, 100),
    document_type: document_type || "avukat_sablon",
    content,
  }).select("id").single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data?.id });
}

// Kayıtlı şablon silme
export async function DELETE(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id gereklidir" }, { status: 400 });

  const serviceSupabase = createServiceClient() as Any;
  const { error } = await serviceSupabase
    .from("generated_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
