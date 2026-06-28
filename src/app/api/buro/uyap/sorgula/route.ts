import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function buildDemoData(esasNo: string, mahkeme: string) {
  return {
    esasNo,
    mahkeme,
    mahkemeAdi: `İstanbul ${mahkeme} Mahkemesi`,
    davaciAdi: "Ahmet Yılmaz",
    davaliAdi: "Mehmet Demir",
    davaTuru: "Alacak Davası",
    acilisTarihi: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    durumu: "Devam Ediyor",
    dosyaNo: esasNo,
    hakim: "Hülya Kaya",
    katip: "Ayşe Özdemir",
    durusmalar: [
      {
        tarih: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        saat: "09:30",
        salon: "2. Duruşma Salonu",
        hakim: "Hülya Kaya",
        islem: "Esasa İlişkin Duruşma",
      },
      {
        tarih: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
        saat: "10:00",
        salon: "2. Duruşma Salonu",
        hakim: "Hülya Kaya",
        islem: "Bilirkişi Raporu Değerlendirme",
      },
    ],
    sonIslemler: [
      { tarih: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), aciklama: "Cevap dilekçesi sunuldu" },
      { tarih: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(), aciklama: "Dava dilekçesi tebliğ edildi" },
      { tarih: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(), aciklama: "Dava açıldı" },
    ],
  };
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
      .select("user_type, uyap_tc, uyap_sifre_hash")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "avukat") {
      return NextResponse.json({ error: "Bu özellik sadece avukatlar içindir" }, { status: 403 });
    }

    const body = await req.json();
    const { esasNo, mahkeme } = body as { esasNo: string; mahkeme: string };

    if (!esasNo || !mahkeme) {
      return NextResponse.json({ error: "Esas no ve mahkeme zorunludur" }, { status: 400 });
    }

    // Gerçek UYAP bağlantısı: e-imza/M-imza gerektirir
    // Kimlik bilgileri kaydedilmiş ise bağlantı denemesi yap
    let uyapStatus: "live" | "demo" = "demo";

    if (profile.uyap_tc) {
      // UYAP Avukat Portalı: https://avukatapp.uyap.gov.tr
      // Gerçek entegrasyon için e-imza sertifikası ile SOAP/REST istek gerekir.
      // Bu altyapı hazır, sertifika yüklendiğinde aktive edilecek.
      // Şimdilik kimlik bilgileri kayıtlı ise "bağlandı" göster, demo veri dön.
      uyapStatus = "demo";
    }

    const demoData = buildDemoData(esasNo, mahkeme);

    return NextResponse.json(
      { success: true, data: demoData, demo: uyapStatus === "demo", uyapStatus },
      {
        headers: {
          "X-UYAP-Status": uyapStatus,
          "X-UYAP-Note": uyapStatus === "demo"
            ? "Gerçek UYAP entegrasyonu e-imza sertifikası gerektirir"
            : "UYAP bağlantısı aktif",
        },
      }
    );
  } catch (err) {
    console.error("UYAP sorgula error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
