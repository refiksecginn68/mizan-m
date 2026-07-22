import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  let query = serviceSupabase
    .from("cases")
    .select(`
      *,
      clients (
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq("lawyer_id", user.id)
    .order("created_at", { ascending: false });

  if (status && status !== "tumu") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,case_number.ilike.%${search}%,court.ilike.%${search}%`);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ cases: data });
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;

  let body: {
    title: string;
    client_id?: string;
    client_name?: string;
    case_number?: string;
    court?: string;
    status?: string;
    description?: string;
    opposing_party?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Dava başlığı zorunludur" }, { status: 400 });
  }

  const { data, error: dbError } = await serviceSupabase
    .from("cases")
    .insert({
      lawyer_id: user.id,
      title: body.title.trim(),
      client_id: body.client_id || null,
      // Müvekkil kaydı olmadan manuel isim — dropdown seçiliyse manuel isim yok sayılır
      client_name: body.client_id ? null : body.client_name?.trim() || null,
      case_number: body.case_number?.trim() || null,
      court: body.court?.trim() || null,
      status: body.status || "aktif",
      description: body.description?.trim() || null,
      opposing_party: body.opposing_party?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select(`
      *,
      clients (
        id,
        full_name
      )
    `)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ case: data }, { status: 201 });
}

// Toplu silme: { ids: string[] } seçilenleri, { all: true } avukatın TÜM dosyalarını siler.
// Her iki durumda da lawyer_id ile sınırlıdır (başka avukatın dosyasına dokunmaz).
export async function DELETE(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;

  let body: { ids?: string[]; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  let query = serviceSupabase.from("cases").delete().eq("lawyer_id", user.id);

  if (!body.all) {
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "Silinecek dosya seçilmedi" }, { status: 400 });
    }
    query = query.in("id", body.ids);
  }

  // select("id") ile silinen satırları geri alıp sayısını döneriz
  const { data, error: dbError } = await query.select("id");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: data?.length ?? 0 });
}
