import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ — ilgili kişi başvurusu.
// Yanıt süresi: en geç 30 gün (KVKK m.13).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    ad_soyad?: string; kimlik_no?: string; adres?: string; eposta?: string;
    telefon?: string; iliski?: string; talep_konusu?: string[]; aciklama?: string;
  } | null;

  if (!body?.ad_soyad || !body.kimlik_no || !body.adres || !body.talep_konusu?.length || !body.aciklama) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
  }

  const yanitSonTarih = new Date();
  yanitSonTarih.setDate(yanitSonTarih.getDate() + 30);

  const svc = createServiceClient() as Any;
  const { error } = await svc.from("kvkk_basvurulari").insert({
    ad_soyad: body.ad_soyad,
    kimlik_no: body.kimlik_no,
    adres: body.adres,
    eposta: body.eposta ?? null,
    telefon: body.telefon ?? null,
    iliski: body.iliski ?? null,
    talep_konusu: body.talep_konusu,
    aciklama: body.aciklama,
    yanit_son_tarih: yanitSonTarih.toISOString().slice(0, 10),
  });

  if (error) {
    console.error("[kvkk-basvuru] kayıt hatası:", error.message);
    return NextResponse.json({ error: "Başvuru kaydedilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
