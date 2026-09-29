import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Avukat panelindeki sayfa bazlı tanıtım turlarının tamamlanma durumu.
// Not: localStorage değil, DB — kullanıcı başka cihazda tekrar görmemeli.

export async function GET() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const { data, error } = await supabase
    .from("onboarding_tur_durumu")
    .select("sayfa, durum")
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const durumMap: Record<string, "tamamlandi" | "atlandi"> = {};
  for (const row of data ?? []) durumMap[row.sayfa] = row.durum;
  return Response.json({ durum: durumMap });
}

export async function POST(req: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const body = await req.json().catch(() => null) as { sayfa?: string; durum?: string } | null;
  if (!body?.sayfa || (body.durum !== "tamamlandi" && body.durum !== "atlandi")) {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { error } = await supabase
    .from("onboarding_tur_durumu")
    .upsert({ user_id: user.id, sayfa: body.sayfa, durum: body.durum }, { onConflict: "user_id,sayfa" });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
