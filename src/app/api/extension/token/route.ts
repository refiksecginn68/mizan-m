import { createClient } from "@/lib/supabase/server";
import { createExtensionToken } from "@/lib/extension-token";
import { getTrialDurum } from "@/lib/trial";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Chrome eklentisi bağlantı kodu üretir (oturum açmış avukat için)
export async function POST() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, full_name, uyap_uets_active, trial_started_at, trial_ends_at, trial_queries_left")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") {
    return Response.json({ error: "Bu özellik sadece avukatlara açıktır" }, { status: 403 });
  }

  // UYAP/UETS eklentisi Max paketinde veya aktif denemede açıktır
  if (!profile.uyap_uets_active && !getTrialDurum(profile).aktif) {
    return Response.json(
      { error: "UYAP/UETS eklentisi için Avukat Max paketi gereklidir.", code: "max_required", cta: { label: "Paketleri Gör", href: "/kredi-yukle" } },
      { status: 403 }
    );
  }

  if (!process.env.INTERNAL_API_SECRET) {
    return Response.json({ error: "Sunucu yapılandırması eksik (INTERNAL_API_SECRET)" }, { status: 500 });
  }

  const token = createExtensionToken(user.id);
  return Response.json({ token, lawyerName: profile.full_name });
}
