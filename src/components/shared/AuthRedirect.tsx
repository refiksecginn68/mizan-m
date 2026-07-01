"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Giriş yapmış kullanıcıyı ana sayfadan dashboard'a yönlendirir (PWA için)
// getUser() kullanır — server-side doğrulama ile geçersiz/süresi dolmuş
// token'ları otomatik filtreler (getSession() aksine).
export default function AuthRedirect() {
  useEffect(() => {
    const supabase = createClient();
    // getUser() Supabase sunucusuyla doğrulama yapar —
    // localStorage'daki bozuk/expired token'lar null döndürür.
    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (error || !user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      if (!profile) return;
      const dest = profile.user_type === "avukat" ? "/buro" : "/panel";
      window.location.href = dest;
    });
  }, []);

  return null;
}
