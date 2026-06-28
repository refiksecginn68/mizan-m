import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createClientFromVekalet } from "@/lib/services/client";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });

    const body = await request.json() as {
      full_name: string;
      tc_no?: string;
      phone?: string;
      email?: string;
      address?: string;
      vekalet_no?: string;
      dosya_no?: string;
      vekalet_tarihi?: string;
      noter?: string;
      notes?: string;
    };

    if (!body.full_name?.trim()) {
      return NextResponse.json({ error: "Ad Soyad zorunludur" }, { status: 400 });
    }

    const svc = createServiceClient() as Any;
    const result = await createClientFromVekalet(svc, {
      ...body,
      full_name: body.full_name.trim(),
      lawyer_id: user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      clientId:    result.clientId,
      alreadyExists: result.alreadyExists ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
