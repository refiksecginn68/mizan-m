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
    due_date?: string;
    // Gelir/gider ve müvekkil/dosya ilişkilendirme — payments.metadata (jsonb) içinde tutulur
    direction?: "gelir" | "gider";
    client_id?: string;
    client_name?: string;
    case_id?: string;
    case_title?: string;
    muhasebe_turu?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Geçerli bir tutar giriniz" }, { status: 400 });
  }

  const metadata: Record<string, string> = {};
  if (body.due_date) metadata.due_date = body.due_date;
  if (body.direction) metadata.direction = body.direction;
  if (body.client_id) metadata.client_id = body.client_id;
  if (body.client_name) metadata.client_name = body.client_name;
  if (body.case_id) metadata.case_id = body.case_id;
  if (body.case_title) metadata.case_title = body.case_title;
  if (body.muhasebe_turu) metadata.muhasebe_turu = body.muhasebe_turu;

  const { data, error: dbError } = await serviceSupabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount: body.amount,
      currency: body.currency || "TRY",
      status: body.status || "success",
      provider: body.provider || "manuel",
      description: body.description?.trim() || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ payment: data }, { status: 201 });
}

// Ödeme durumu güncelleme — taksit satırında "Ödendi" işaretleme
export async function PATCH(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  let body: { id: string; status: "pending" | "success" | "failed" | "refunded" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (!body.id || !["pending", "success", "failed", "refunded"].includes(body.status)) {
    return NextResponse.json({ error: "Geçersiz parametre" }, { status: 400 });
  }

  const serviceSupabase = createServiceClient() as AnyClient;
  const { data, error: dbError } = await serviceSupabase
    .from("payments")
    .update({ status: body.status })
    .eq("id", body.id)
    .eq("user_id", user.id) // yalnızca kendi kaydı
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ payment: data });
}

// Kaydı tam düzenle (tutar/açıklama/durum/tarih/yön/ilişki). Yalnızca kendi kaydı.
export async function PUT(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  let body: {
    id: string;
    amount?: number;
    status?: string;
    description?: string;
    due_date?: string;
    direction?: "gelir" | "gider";
    client_id?: string; client_name?: string;
    case_id?: string; case_title?: string;
    muhasebe_turu?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Kayıt kimliği gerekli" }, { status: 400 });
  if (body.amount !== undefined && (!body.amount || body.amount <= 0)) {
    return NextResponse.json({ error: "Geçerli bir tutar giriniz" }, { status: 400 });
  }

  const svc = createServiceClient() as AnyClient;

  // Mevcut metadata'yı koru, gelen alanları üzerine yaz
  const { data: mevcut } = await svc
    .from("payments")
    .select("metadata")
    .eq("id", body.id)
    .eq("user_id", user.id)
    .single();
  if (!mevcut) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  const metadata: Record<string, string> = { ...(mevcut.metadata ?? {}) };
  if (body.due_date !== undefined) metadata.due_date = body.due_date;
  if (body.direction !== undefined) metadata.direction = body.direction;
  if (body.client_id !== undefined) metadata.client_id = body.client_id;
  if (body.client_name !== undefined) metadata.client_name = body.client_name;
  if (body.case_id !== undefined) metadata.case_id = body.case_id;
  if (body.case_title !== undefined) metadata.case_title = body.case_title;
  if (body.muhasebe_turu !== undefined) metadata.muhasebe_turu = body.muhasebe_turu;

  const guncelle: Record<string, unknown> = { metadata: Object.keys(metadata).length ? metadata : null };
  if (body.amount !== undefined) guncelle.amount = body.amount;
  if (body.status !== undefined) guncelle.status = body.status;
  if (body.description !== undefined) guncelle.description = body.description?.trim() || null;

  const { data, error: dbError } = await svc
    .from("payments")
    .update(guncelle)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ payment: data });
}

// Kayıt sil. { id } → tek kayıt; { ids: [...] } → toplu (tüm taksit planı). Yalnızca kendi kaydı.
export async function DELETE(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  let body: { id?: string; ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const ids = body.ids?.length ? body.ids : body.id ? [body.id] : [];
  if (!ids.length) return NextResponse.json({ error: "Silinecek kayıt yok" }, { status: 400 });

  const svc = createServiceClient() as AnyClient;
  const { error: dbError } = await svc
    .from("payments")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id); // yalnızca kendi kayıtları silinir

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true, deleted: ids.length });
}
