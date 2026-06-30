import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const body = await req.json() as { esasNo?: string; tcKimlik?: string };
    const { esasNo, tcKimlik } = body;

    if (!esasNo?.trim()) {
      return NextResponse.json({ error: "Esas no zorunludur" }, { status: 400 });
    }
    if (!tcKimlik || tcKimlik.length !== 11) {
      return NextResponse.json({ error: "Geçerli TC kimlik no gereklidir" }, { status: 400 });
    }

    // UYAP Vatandaş Portalı entegrasyonu
    // Gerçek entegrasyon: https://vatandas.uyap.gov.tr API'si e-Devlet altyapısı kullanır.
    // Üretimde: TC + UYAP şifre ile token alınır, ardından dosya sorgulanır.
    // Şimdilik demo veri — altyapı hazır, resmi API erişimi ile aktive edilecek.

    const demoData = {
      esasNo,
      mahkeme: "Asliye Hukuk",
      mahkemeAdi: "İstanbul 3. Asliye Hukuk Mahkemesi",
      davaciAdi: `TC ${tcKimlik.slice(0, 3)}***${tcKimlik.slice(-2)} - ${user.id.slice(0, 4)}`, // TC maskelendi
      davaliAdi: "Karşı Taraf",
      davaTuru: "Alacak Davası",
      acilisTarihi: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
      durumu: "Devam Ediyor",
      hakim: "Hülya Kaya",
      durusmalar: [
        {
          tarih: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString(),
          saat: "09:30",
          salon: "3. Duruşma Salonu",
          hakim: "Hülya Kaya",
          islem: "Esasa Dair Duruşma",
        },
      ],
      sonIslemler: [
        { tarih: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), aciklama: "Cevap dilekçesi teslim alındı" },
        { tarih: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(), aciklama: "Dava açıldı" },
      ],
    };

    return NextResponse.json({ success: true, data: demoData });
  } catch (err) {
    console.error("Vatandaş UYAP sorgula error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
