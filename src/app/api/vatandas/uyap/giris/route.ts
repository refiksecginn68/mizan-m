import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// Demo: her TC için birden fazla dosya üretir
function generateDemoFiles(tcKimlik: string, userId: string) {
  const now = Date.now();
  const seed = parseInt(tcKimlik.slice(-3)) || 42;

  const DAVA_TURLERI = [
    "Alacak Davası", "Boşanma Davası", "Tapu İptali", "İş Davası",
    "Kira Uyuşmazlığı", "Miras Davası", "Tazminat Davası",
  ];
  const MAHKEMELER = [
    { kisa: "Asliye Hukuk", tam: "İstanbul 3. Asliye Hukuk Mahkemesi" },
    { kisa: "İş", tam: "İstanbul 7. İş Mahkemesi" },
    { kisa: "Aile", tam: "Ankara 2. Aile Mahkemesi" },
    { kisa: "Ticaret", tam: "İstanbul 4. Asliye Ticaret Mahkemesi" },
  ];
  const HAKIMLER = ["Hülya Kaya", "Ahmet Çelik", "Fatma Arslan", "Mehmet Demir"];

  const count = (seed % 3) + 1; // 1-3 dosya
  const files = [];

  for (let i = 0; i < count; i++) {
    const idx = (seed + i) % DAVA_TURLERI.length;
    const mIdx = (seed + i) % MAHKEMELER.length;
    const year = 2023 + (i % 2);
    const no = 1000 + seed + i * 100;
    const esasNo = `${year}/${no}`;
    const mahkeme = MAHKEMELER[mIdx];
    const hakim = HAKIMLER[(seed + i) % HAKIMLER.length];

    const file = {
      esasNo,
      mahkeme: mahkeme.kisa,
      mahkemeAdi: mahkeme.tam,
      davaciAdi: `TC ${tcKimlik.slice(0, 3)}***${tcKimlik.slice(-2)} — ${userId.slice(0, 4)}`,
      davaliAdi: i % 2 === 0 ? "Karşı Taraf A.Ş." : "Karşı Taraf",
      davaTuru: DAVA_TURLERI[idx],
      acilisTarihi: new Date(now - (180 + i * 60) * 24 * 3600 * 1000).toISOString(),
      durumu: i === 0 ? "Devam Ediyor" : "Karar Bekleniyor",
      hakim,
      durusmalar: [
        {
          tarih: new Date(now + (14 + i * 7) * 24 * 3600 * 1000).toISOString(),
          saat: i % 2 === 0 ? "09:30" : "14:00",
          salon: `${i + 2}. Duruşma Salonu`,
          hakim,
          islem: "Esasa Dair Duruşma",
        },
      ],
      sonIslemler: [
        { tarih: new Date(now - 10 * 24 * 3600 * 1000).toISOString(), aciklama: "Cevap dilekçesi teslim alındı" },
        { tarih: new Date(now - (45 + i * 30) * 24 * 3600 * 1000).toISOString(), aciklama: "Dava açıldı" },
      ],
    };
    files.push(file);
  }

  return files;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const body = await req.json() as { tcKimlik?: string; uyapSifre?: string };
    const { tcKimlik, uyapSifre } = body;

    if (!tcKimlik || tcKimlik.length !== 11) {
      return NextResponse.json({ error: "Geçerli TC kimlik no girin (11 hane)" }, { status: 400 });
    }
    if (!uyapSifre || uyapSifre.length < 4) {
      return NextResponse.json({ error: "UYAP şifrenizi girin" }, { status: 400 });
    }

    // UYAP kimlik doğrulama simülasyonu
    // Gerçek entegrasyon: e-Devlet/UYAP vatandaş portalı OAuth akışı
    await new Promise((r) => setTimeout(r, 800));

    const files = generateDemoFiles(tcKimlik, user.id);

    // Dosyaları DB'ye kaydet (upsert)
    const serviceSupabase = createServiceClient() as AnyClient;
    const upsertData = files.map((f) => ({
      user_id: user.id,
      esas_no: f.esasNo,
      mahkeme_adi: f.mahkemeAdi,
      dava_turu: f.davaTuru,
      davaci: f.davaciAdi,
      davali: f.davaliAdi,
      hakim: f.hakim,
      acilis_tarihi: f.acilisTarihi,
      durumu: f.durumu,
      dosya_json: f,
    }));

    await serviceSupabase
      .from("uyap_vatandas_files")
      .upsert(upsertData, { onConflict: "user_id,esas_no" });

    return NextResponse.json({ success: true, files, demo: true });
  } catch (err) {
    console.error("Vatandaş UYAP giris error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
