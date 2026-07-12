import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getAuthenticatedUser() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Süresi gelen etkinlik hatırlatıcılarını bildirime dönüştürür.
// Vercel Hobby cron günde 1 çalıştığı için "1 saat kala" gibi hatırlatıcılar
// kullanıcı uygulamadayken bu GET üzerinden materyalize edilir (zil polling'i).
async function materializeReminders(svc: AnyClient, userId: string) {
  const now = Date.now();
  const { data: events } = await svc
    .from("calendar_events")
    .select("id, title, starts_at, event_type, reminder_offsets_minutes, reminders_sent_minutes")
    .eq("lawyer_id", userId)
    .gte("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + 4320 * 60000).toISOString());

  for (const ev of events ?? []) {
    const offsets: number[] = ev.reminder_offsets_minutes ?? [];
    const sent: number[] = ev.reminders_sent_minutes ?? [];
    const due = offsets.filter(
      (m) => !sent.includes(m) && new Date(ev.starts_at).getTime() - m * 60000 <= now
    );
    if (due.length === 0) continue;

    const startsStr = new Date(ev.starts_at).toLocaleString("tr-TR", {
      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });
    const labels: Record<number, string> = { 60: "1 saatten", 1440: "1 günden", 4320: "3 günden" };
    for (const m of due) {
      await svc.from("notifications").insert({
        user_id: userId,
        type: ev.event_type === "durusma" ? "durusma" : "sure",
        title: `Hatırlatma: ${ev.title}`,
        body: `${startsStr} tarihli etkinliğinize ${labels[m] ?? `${m} dakikadan`} az kaldı.`,
        reference_id: ev.id,
      });
    }
    await svc
      .from("calendar_events")
      .update({ reminders_sent_minutes: [...sent, ...due] })
      .eq("id", ev.id);
  }
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekiyor" }, { status: 401 });

  const svc = createServiceClient() as AnyClient;
  await materializeReminders(svc, user.id);

  const { data, error } = await svc
    .from("notifications")
    .select("id, type, title, body, is_read, reference_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const unread = (data ?? []).filter((n: { is_read: boolean }) => !n.is_read).length;
  return NextResponse.json({ notifications: data, unread });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekiyor" }, { status: 401 });

  let body: { id?: string; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const svc = createServiceClient() as AnyClient;
  let query = svc.from("notifications").update({ is_read: true }).eq("user_id", user.id);
  if (!body.all) {
    if (!body.id) return NextResponse.json({ error: "id veya all gerekli" }, { status: 400 });
    query = query.eq("id", body.id);
  }
  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
