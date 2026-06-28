import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function GET() {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const serviceSupabase = createServiceClient() as AnyClient;
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "avukat") {
      return NextResponse.json({ error: "Bu özellik sadece avukatlar içindir" }, { status: 403 });
    }

    const { data, error } = await serviceSupabase
      .from("tebligat_records")
      .select(`
        id,
        case_id,
        sender,
        subject,
        received_at,
        deadline_at,
        status,
        content,
        is_read,
        created_at,
        cases (id, title, case_number)
      `)
      .eq("lawyer_id", user.id)
      .order("deadline_at", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Tebligat GET error:", error);
      return NextResponse.json({ error: "Tebligatlar alınamadı" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Tebligat GET error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const serviceSupabase = createServiceClient() as AnyClient;
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "avukat") {
      return NextResponse.json({ error: "Bu özellik sadece avukatlar içindir" }, { status: 403 });
    }

    const body = await req.json();
    const { sender, subject, received_at, deadline_at, content, case_id } = body as {
      sender: string;
      subject: string;
      received_at?: string;
      deadline_at?: string;
      content?: string;
      case_id?: string;
    };

    if (!sender || !subject) {
      return NextResponse.json({ error: "Gönderen ve konu zorunludur" }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      lawyer_id: user.id,
      sender,
      subject,
      received_at: received_at || new Date().toISOString(),
      status: "beklemede",
      is_read: false,
    };

    if (deadline_at) insertData.deadline_at = deadline_at;
    if (content) insertData.content = content;
    if (case_id) insertData.case_id = case_id;

    const { data, error } = await serviceSupabase
      .from("tebligat_records")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Tebligat POST error:", error);
      return NextResponse.json({ error: "Tebligat eklenemedi" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Tebligat POST error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const serviceSupabase = createServiceClient() as AnyClient;
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "avukat") {
      return NextResponse.json({ error: "Bu özellik sadece avukatlar içindir" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "ID zorunludur" }, { status: 400 });
    }

    const { data, error } = await serviceSupabase
      .from("tebligat_records")
      .update({ is_read: true })
      .eq("id", id)
      .eq("lawyer_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Tebligat PATCH error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
