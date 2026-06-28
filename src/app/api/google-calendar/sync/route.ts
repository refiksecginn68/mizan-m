import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCalendarClient } from "@/lib/google-calendar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// Google → Mizanım event türü eşleştirmesi
function guessEventType(summary: string): string {
  const s = summary.toLowerCase();
  if (s.includes("duruşma") || s.includes("durusma") || s.includes("mahkeme")) return "durusma";
  if (s.includes("toplantı") || s.includes("toplanti") || s.includes("görüşme")) return "toplanti";
  if (s.includes("süre") || s.includes("sure") || s.includes("deadline") || s.includes("son gün")) return "sure";
  return "diger";
}

export async function POST() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const serviceSupabase = createServiceClient() as AnyClient;

  // Token'ı al
  const { data: tokenRow } = await serviceSupabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("lawyer_id", user.id)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ error: "Google Takvim bağlı değil" }, { status: 400 });
  }

  try {
    const calendar = getCalendarClient(
      tokenRow.access_token,
      tokenRow.refresh_token,
      tokenRow.expiry_date
    );

    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: threeMonthsLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const googleEvents = res.data.items ?? [];
    let imported = 0;

    for (const gEvent of googleEvents) {
      if (!gEvent.id || !gEvent.summary) continue;
      const startsAt = gEvent.start?.dateTime ?? gEvent.start?.date;
      if (!startsAt) continue;

      // Daha önce import edilmişse güncelle, yoksa ekle
      const { data: existing } = await serviceSupabase
        .from("calendar_events")
        .select("id")
        .eq("lawyer_id", user.id)
        .eq("google_event_id", gEvent.id)
        .single();

      if (existing) {
        await serviceSupabase
          .from("calendar_events")
          .update({
            title: gEvent.summary,
            starts_at: startsAt,
            ends_at: gEvent.end?.dateTime ?? gEvent.end?.date ?? null,
            location: gEvent.location ?? null,
            description: gEvent.description ?? null,
          })
          .eq("id", existing.id);
      } else {
        await serviceSupabase
          .from("calendar_events")
          .insert({
            lawyer_id: user.id,
            title: gEvent.summary,
            event_type: guessEventType(gEvent.summary),
            starts_at: startsAt,
            ends_at: gEvent.end?.dateTime ?? gEvent.end?.date ?? null,
            location: gEvent.location ?? null,
            description: gEvent.description ?? null,
            google_event_id: gEvent.id,
          });
        imported++;
      }
    }

    return NextResponse.json({ synced: googleEvents.length, imported });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
