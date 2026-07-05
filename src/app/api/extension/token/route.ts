import { createClient } from "@/lib/supabase/server";
import { createExtensionToken } from "@/lib/extension-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Chrome eklentisi bağlantı kodu üretir (oturum açmış avukat için)
export async function POST() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") {
    return Response.json({ error: "Bu özellik sadece avukatlara açıktır" }, { status: 403 });
  }

  if (!process.env.INTERNAL_API_SECRET) {
    return Response.json({ error: "Sunucu yapılandırması eksik (INTERNAL_API_SECRET)" }, { status: 500 });
  }

  const token = createExtensionToken(user.id);
  return Response.json({ token, lawyerName: profile.full_name });
}
