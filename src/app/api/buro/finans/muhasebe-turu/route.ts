import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const KAYIT_TURLERI = ["muvekkil", "serbest", "gider"] as const;

// Kullanıcının Finans → Yeni Kayıt modalında serbest yazdığı Muhasebe Türü kalemini
// kayıt türüne göre ayrı listede kalıcı kaydeder (RLS: kullanıcı sadece kendi profilini günceller).
export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { kayitTur?: string; ad?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const kayitTur = body.kayitTur;
  const ad = (body.ad ?? "").trim();
  if (!ad || !KAYIT_TURLERI.includes(kayitTur as Any)) {
    return Response.json({ error: "Geçersiz parametre" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ozel_muhasebe_turleri")
    .eq("id", user.id)
    .single();

  const mevcut = (profile?.ozel_muhasebe_turleri as Record<string, string[]> | null) ?? {};
  const liste = mevcut[kayitTur!] ?? [];
  if (!liste.includes(ad)) {
    const guncel = { ...mevcut, [kayitTur!]: [...liste, ad] };
    await supabase.from("profiles").update({ ozel_muhasebe_turleri: guncel }).eq("id", user.id);
  }

  return Response.json({ success: true });
}
