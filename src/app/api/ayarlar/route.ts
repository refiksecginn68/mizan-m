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

  const body = await request.json().catch(() => ({})) as {
    email_notifications?: boolean;
    push_enabled?: boolean;
    notify_tasks?: boolean;
    notify_payments?: boolean;
    notify_tebligat?: boolean;
  };

  const updates: Record<string, boolean> = {};
  if (typeof body.email_notifications === "boolean") updates.email_notifications = body.email_notifications;
  if (typeof body.push_enabled === "boolean") updates.push_enabled = body.push_enabled;
  if (typeof body.notify_tasks === "boolean") updates.notify_tasks = body.notify_tasks;
  if (typeof body.notify_payments === "boolean") updates.notify_payments = body.notify_payments;
  if (typeof body.notify_tebligat === "boolean") updates.notify_tebligat = body.notify_tebligat;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const svc = createServiceClient() as Any;
  const { error } = await svc
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  return NextResponse.json({ success: true });
}
