import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { full_name?: string; phone?: string };

  if (!body.full_name?.trim()) {
    return Response.json({ error: "Ad soyad zorunludur" }, { status: 400 });
  }

  const serviceSupabase = createServiceClient() as Any;
  const { error } = await serviceSupabase
    .from("profiles")
    .update({
      full_name: body.full_name.trim(),
      phone: body.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
