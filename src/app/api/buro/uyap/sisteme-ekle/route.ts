import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profile?.user_type !== "avukat") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await req.json() as {
      esasNo: string;
      davaData: {
        mahkemeAdi?: string;
        davaTuru?: string;
        davaciAdi?: string;
        davaliAdi?: string;
        hakim?: string;
        acilisTarihi?: string;
        durumu?: string;
      };
      clientId?: string;
    };

    const { esasNo, davaData, clientId } = body;

    if (!esasNo?.trim()) {
      return NextResponse.json({ error: "Esas no zorunludur" }, { status: 400 });
    }

    const serviceSupabase = createServiceClient() as AnyClient;

    // Aynı esas no zaten var mı?
    const { data: existing } = await serviceSupabase
      .from("cases")
      .select("id")
      .eq("lawyer_id", user.id)
      .eq("case_number", esasNo)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, caseId: existing.id, alreadyExists: true });
    }

    // Yeni dava oluştur
    const { data: newCase, error } = await serviceSupabase
      .from("cases")
      .insert({
        lawyer_id: user.id,
        client_id: clientId ?? null,
        title: davaData.davaTuru ?? "UYAP Dosyası",
        case_number: esasNo,
        court: davaData.mahkemeAdi ?? "",
        case_type: davaData.davaTuru ?? "",
        status: "aktif",
        description: `UYAP'tan entegre edildi. Davacı: ${davaData.davaciAdi ?? "-"}, Davalı: ${davaData.davaliAdi ?? "-"}, Hakim: ${davaData.hakim ?? "-"}`,
        start_date: davaData.acilisTarihi ? new Date(davaData.acilisTarihi).toISOString().split("T")[0] : null,
        uyap_status: davaData.durumu ?? "Devam Ediyor",
        is_uyap_synced: true,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, caseId: newCase.id, alreadyExists: false });
  } catch (err) {
    console.error("UYAP sisteme-ekle error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
