"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Giriş yapmış kullanıcıyı ana sayfadan dashboard'a yönlendirir (PWA için gerekli)
export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();
      router.replace(profile?.user_type === "avukat" ? "/buro" : "/panel");
    });
  }, [router]);

  return null;
}
