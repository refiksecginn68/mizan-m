import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

async function redirectByUserType(supabase: Any, origin: string): Promise<NextResponse> {
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
  return NextResponse.redirect(`${origin}/giris`);
}

function errorRedirect(origin: string, message: string): NextResponse {
  const errorUrl = new URL(`${origin}/auth/hata`);
  errorUrl.searchParams.set("reason", message.toLowerCase().includes("expired") ? "expired" : "invalid");
  return NextResponse.redirect(errorUrl);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // E-posta doğrulama / şifre sıfırlama: token_hash sunucuda doğrulanır,
  // oturum çerezleri burada set edilir (hash-fragment sorunu yaşanmaz)
  if (tokenHash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (error) return errorRedirect(origin, error.message);

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password?type=recovery`);
    }
    return redirectByUserType(supabase, origin);
  }

  // OAuth / PKCE akışı
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return redirectByUserType(supabase, origin);
    return errorRedirect(origin, error.message);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
