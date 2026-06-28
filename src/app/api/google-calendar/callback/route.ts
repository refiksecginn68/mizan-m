import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createOAuthClient } from "@/lib/google-calendar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/buro/takvim?google=error`);
  }

  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl}/giris`);

  try {
    const oauthClient = createOAuthClient();
    const { tokens } = await oauthClient.getToken(code);

    const serviceSupabase = createServiceClient() as AnyClient;
    await serviceSupabase
      .from("google_calendar_tokens")
      .upsert({
        lawyer_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expiry_date: tokens.expiry_date ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "lawyer_id" });

    return NextResponse.redirect(`${appUrl}/buro/takvim?google=connected`);
  } catch {
    return NextResponse.redirect(`${appUrl}/buro/takvim?google=error`);
  }
}
