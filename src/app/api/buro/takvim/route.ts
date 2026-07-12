import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCalendarClient, eventTypeToDescription } from "@/lib/google-calendar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getAuthenticatedLawyer() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: "Oturum açmanız gerekiyor" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") {
    return { user: null, error: "Bu işlem için avukat hesabı gerekiyor" };
  }

  return { user, error: null };
}

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = serviceSupabase
    .from("calendar_events")
    .select(`
      *,
      cases (
        id,
        title,
        case_number
      ),
      clients (
        id,
        full_name
      )
    `)
    .eq("lawyer_id", user.id)
    .order("starts_at", { ascending: true });

  if (from) {
    query = query.gte("starts_at", from);
  }
  if (to) {
    query = query.lte("starts_at", to);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;

  let body: {
    title: string;
    event_type: string;
    starts_at: string;
    ends_at?: string;
    case_id?: string;
    client_id?: string;
    location?: string;
    description?: string;
    urgency?: string;
    reminder_offsets_minutes?: number[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Etkinlik başlığı zorunludur" }, { status: 400 });
  }

  if (!body.starts_at) {
    return NextResponse.json({ error: "Başlangıç tarihi zorunludur" }, { status: 400 });
  }

  const VALID_URGENCY = ["dusuk", "orta", "yuksek", "acil"];
  const VALID_OFFSETS = [60, 1440, 4320]; // 1 saat, 1 gün, 3 gün (dakika)
  const urgency = VALID_URGENCY.includes(body.urgency ?? "") ? body.urgency : "orta";
  const reminderOffsets = Array.isArray(body.reminder_offsets_minutes)
    ? body.reminder_offsets_minutes.filter((m) => VALID_OFFSETS.includes(m))
    : [];

  const { data, error: dbError } = await serviceSupabase
    .from("calendar_events")
    .insert({
      lawyer_id: user.id,
      title: body.title.trim(),
      event_type: body.event_type || "diger",
      starts_at: body.starts_at,
      ends_at: body.ends_at || null,
      case_id: body.case_id || null,
      client_id: body.client_id || null,
      location: body.location?.trim() || null,
      description: body.description?.trim() || null,
      urgency,
      reminder_offsets_minutes: reminderOffsets,
    })
    .select(`
      *,
      cases (id, title, case_number),
      clients (id, full_name)
    `)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Google Takvim bağlıysa etkinliği oraya da ekle
  const { data: tokenRow } = await serviceSupabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("lawyer_id", user.id)
    .single();

  if (tokenRow && data) {
    try {
      const calendar = getCalendarClient(
        tokenRow.access_token,
        tokenRow.refresh_token,
        tokenRow.expiry_date
      );
      const gEvent = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: body.title.trim(),
          description: `[${eventTypeToDescription(body.event_type ?? "diger")}] ${body.description?.trim() ?? ""}`.trim(),
          location: body.location?.trim() ?? undefined,
          start: { dateTime: body.starts_at },
          end: { dateTime: body.ends_at ?? body.starts_at },
        },
      });
      if (gEvent.data.id) {
        await serviceSupabase
          .from("calendar_events")
          .update({ google_event_id: gEvent.data.id })
          .eq("id", data.id);
        data.google_event_id = gEvent.data.id;
      }
    } catch {
      // Google hatası ana işlemi engellemesin
    }
  }

  return NextResponse.json({ event: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const serviceSupabase = createServiceClient() as AnyClient;
  const { error: dbError } = await serviceSupabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("lawyer_id", user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
