import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .single() as { data: { user_type: string } | null };

        const destination = profile?.user_type === "avukat" ? "/buro" : "/panel";
        return NextResponse.redirect(`${origin}${destination}`);
      }
    } else {
      // Token geçersiz veya süresi dolmuş
      const errorUrl = new URL(`${origin}/auth/hata`);
      errorUrl.searchParams.set("reason", error.message.includes("expired") ? "expired" : "invalid");
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
