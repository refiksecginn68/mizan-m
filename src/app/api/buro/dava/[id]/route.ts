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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;

  const { data: caseData, error: caseError } = await serviceSupabase
    .from("cases")
    .select(`
      *,
      clients (
        id,
        full_name,
        email,
        phone,
        tc_no,
        address
      )
    `)
    .eq("id", params.id)
    .eq("lawyer_id", user.id)
    .single();

  if (caseError || !caseData) {
    return NextResponse.json({ error: "Dava bulunamadı" }, { status: 404 });
  }

  const { data: documents } = await serviceSupabase
    .from("case_documents")
    .select("*")
    .eq("case_id", params.id)
    .eq("lawyer_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    case: caseData,
    documents: documents || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { data, error: dbError } = await serviceSupabase
    .from("cases")
    .update(body)
    .eq("id", params.id)
    .eq("lawyer_id", user.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ case: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;

  // lawyer_id filtresi başka avukatın dosyasını silmeyi engeller.
  // İlişkili kayıtlar DB'de CASCADE/SET NULL ile otomatik temizlenir (bkz. 001_schema.sql).
  const { data, error: dbError } = await serviceSupabase
    .from("cases")
    .delete()
    .eq("id", params.id)
    .eq("lawyer_id", user.id)
    .select("id");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deleted: data.length });
}
