import { createClient } from "@/lib/supabase/server";
import { FAVORI_SAYISI, gecerliFavoriKey } from "@/lib/buro-favoriler";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Ana sayfa favorilerini kaydet. Oturum client'ı kullanılır → RLS
// (profiles_update_own) gereği kullanıcı yalnız kendi satırını günceller.
export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum bulunamadı" }, { status: 401 });

  let keys: unknown;
  try {
    ({ keys } = await request.json());
  } catch {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!Array.isArray(keys) || keys.length !== FAVORI_SAYISI) {
    return Response.json({ error: `Tam ${FAVORI_SAYISI} favori seçilmelidir` }, { status: 400 });
  }
  const benzersiz = new Set(keys);
  if (benzersiz.size !== FAVORI_SAYISI || keys.some((k) => typeof k !== "string" || !gecerliFavoriKey(k))) {
    return Response.json({ error: "Geçersiz favori listesi" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ dashboard_favorites: keys })
    .eq("id", user.id);

  if (error) return Response.json({ error: "Kaydedilemedi" }, { status: 500 });
  return Response.json({ success: true, favorites: keys });
}
