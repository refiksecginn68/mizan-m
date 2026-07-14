import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Hesap ayarları — şimdilik yalnız e-posta bildirim tercihi (DB'de tutulur;
// görünüm ayarları cihaza özel olduğundan localStorage'da)
export async function PATCH(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { email_notifications?: boolean };
  if (typeof body.email_notifications !== "boolean") {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const svc = createServiceClient() as Any;
  const { error } = await svc
    .from("profiles")
    .update({ email_notifications: body.email_notifications })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  return NextResponse.json({ success: true });
}
