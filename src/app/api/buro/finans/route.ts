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

  // Kullanıcının ödemelerini çek — payments tablosu user_id kullanıyor
  let query = serviceSupabase
    .from("payments")
    .select(`
      *,
      profiles!payments_user_id_fkey (
        id,
        full_name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status && status !== "tumu") {
    query = query.eq("status", status);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    // Fallback: join olmadan dene
    const { data: fallbackData, error: fallbackError } = await serviceSupabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }
    return NextResponse.json({ payments: fallbackData || [] });
  }

  return NextResponse.json({ payments: data || [] });
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;

  let body: {
    amount: number;
    currency?: string;
    type?: string;
    status?: string;
    description?: string;
    provider?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Geçerli bir tutar giriniz" }, { status: 400 });
  }

  const { data, error: dbError } = await serviceSupabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount: body.amount,
      currency: body.currency || "TRY",
      status: body.status || "success",
      provider: body.provider || "manuel",
      description: body.description?.trim() || null,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ payment: data }, { status: 201 });
}
