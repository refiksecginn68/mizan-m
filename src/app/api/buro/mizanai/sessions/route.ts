import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function GET() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data } = await svc
    .from("sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return Response.json({ sessions: data ?? [] });
}

export async function DELETE(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json() as { id: string };
  const svc = createServiceClient() as Any;
  await svc.from("messages").delete().eq("session_id", id);
  await svc.from("sessions").delete().eq("id", id).eq("user_id", user.id);
  return Response.json({ success: true });
}
