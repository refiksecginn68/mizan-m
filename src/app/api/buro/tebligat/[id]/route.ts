import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status, case_id, is_read } = body as {
      status?: string;
      case_id?: string;
      is_read?: boolean;
    };

    // Gerçek şemada status/is_read yok — is_processed'a eşlenir
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.is_processed = status === "islendi" || status === "okundu";
    if (case_id !== undefined) updateData.case_id = case_id;
    if (is_read !== undefined) updateData.is_processed = is_read;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
    }

    const { data, error } = await serviceSupabase
      .from("tebligat_records")
      .update(updateData)
      .eq("id", params.id)
      .eq("lawyer_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Tebligat [id] PATCH error:", error);
      return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Tebligat [id] PATCH error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { error } = await serviceSupabase
      .from("tebligat_records")
      .delete()
      .eq("id", params.id)
      .eq("lawyer_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Tebligat [id] DELETE error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
