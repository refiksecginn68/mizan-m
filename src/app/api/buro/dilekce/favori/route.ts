import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

async function getUser() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Favori şablon id listesi
export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data, error } = await svc
    .from("dilekce_favoriler")
    .select("sablon_id")
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ favoriler: (data ?? []).map((r: Any) => r.sablon_id) });
}

// Favoriye ekle
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { sablon_id } = await request.json() as { sablon_id?: string };
  if (!sablon_id?.trim()) return Response.json({ error: "sablon_id gereklidir" }, { status: 400 });

  const svc = createServiceClient() as Any;
  const { error } = await svc
    .from("dilekce_favoriler")
    .upsert({ user_id: user.id, sablon_id }, { onConflict: "user_id,sablon_id" });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// Favoriden çıkar
export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sablonId = new URL(request.url).searchParams.get("sablon_id");
  if (!sablonId) return Response.json({ error: "sablon_id gereklidir" }, { status: 400 });

  const svc = createServiceClient() as Any;
  const { error } = await svc
    .from("dilekce_favoriler")
    .delete()
    .eq("user_id", user.id)
    .eq("sablon_id", sablonId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
