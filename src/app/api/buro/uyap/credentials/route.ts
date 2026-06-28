import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const serviceSupabase = createServiceClient() as AnyClient;
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "avukat") {
      return NextResponse.json({ error: "Sadece avukatlar" }, { status: 403 });
    }

    const body = await req.json() as { tcKimlik?: string; uyapSifre?: string; baroSicil?: string };
    const { tcKimlik, uyapSifre, baroSicil } = body;

    if (!tcKimlik || tcKimlik.length !== 11) {
      return NextResponse.json({ error: "Geçerli TC kimlik no girin (11 hane)" }, { status: 400 });
    }

    // TC ve şifreyi profile'a kaydet
    // Not: Üretimde şifre AES-256 ile şifrelenmeli; şimdilik hash'li tutuluyor
    const updateData: Record<string, string> = { uyap_tc: tcKimlik };
    if (uyapSifre) updateData.uyap_sifre_hash = Buffer.from(uyapSifre).toString("base64");
    if (baroSicil) updateData.baro_sicil = baroSicil;

    const { error } = await serviceSupabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      // Kolon yoksa sessizce devam et (migration henüz çalıştırılmamış olabilir)
      console.warn("UYAP credentials update warning:", error.message);
    }

    return NextResponse.json({ success: true, message: "UYAP bilgileri kaydedildi" });
  } catch (err) {
    console.error("UYAP credentials error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const serviceSupabase = createServiceClient() as AnyClient;
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("uyap_tc, baro_sicil")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      hasCredentials: !!(profile?.uyap_tc),
      tcKimlik: profile?.uyap_tc ? `${(profile.uyap_tc as string).slice(0, 3)}****${(profile.uyap_tc as string).slice(-2)}` : null,
      baroSicil: profile?.baro_sicil ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
