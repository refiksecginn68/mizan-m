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
  const search = searchParams.get("search") || "";

  let query = serviceSupabase
    .from("clients")
    .select("*")
    .eq("lawyer_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,tc_no.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data });
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;

  let body: {
    full_name: string;
    email?: string;
    phone?: string;
    tc_no?: string;
    address?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: "Ad soyad zorunludur" }, { status: 400 });
  }

  const { data, error: dbError } = await serviceSupabase
    .from("clients")
    .insert({
      lawyer_id: user.id,
      full_name: body.full_name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      tc_no: body.tc_no?.trim() || null,
      address: body.address?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ client: data }, { status: 201 });
}
