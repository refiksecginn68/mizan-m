import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Ayarlar > "Tanıtım turunu yeniden başlat" — kullanıcının tüm sayfa tur kayıtlarını siler.
export async function POST() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const { error } = await supabase
    .from("onboarding_tur_durumu")
    .delete()
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
