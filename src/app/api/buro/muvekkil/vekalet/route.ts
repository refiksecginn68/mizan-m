import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createClientFromVekalet } from "@/lib/services/client";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mockBelgeler(esasNo: string) {
  return [
    { id: `${esasNo}-1`, ad: "Dava Dilekçesi", tur: "UDF", tarih: new Date(Date.now() - 90 * 86400000).toISOString(), boyut: "124 KB" },
    { id: `${esasNo}-2`, ad: "Cevap Dilekçesi", tur: "UDF", tarih: new Date(Date.now() - 60 * 86400000).toISOString(), boyut: "88 KB" },
    { id: `${esasNo}-3`, ad: "Delil Listesi", tur: "PDF", tarih: new Date(Date.now() - 45 * 86400000).toISOString(), boyut: "256 KB" },
    { id: `${esasNo}-4`, ad: "Bilirkişi Raporu", tur: "PDF", tarih: new Date(Date.now() - 14 * 86400000).toISOString(), boyut: "1.2 MB" },
    { id: `${esasNo}-5`, ad: "Duruşma Tutanağı", tur: "UDF", tarih: new Date(Date.now() - 7 * 86400000).toISOString(), boyut: "45 KB" },
  ];
}

function buildDemoUyapData(esasNo: string) {
  return {
    esasNo,
    mahkemeAdi: "İstanbul 3. Asliye Hukuk Mahkemesi",
    davaTuru: "Alacak Davası",
    davaciAdi: "Müvekkil",
    davaliAdi: "Karşı Taraf",
    hakim: "Hülya Kaya",
    acilisTarihi: new Date(Date.now() - 90 * 86400000).toISOString(),
    durumu: "Devam Ediyor",
  };
}

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

    // Dosya no varsa UYAP'tan otomatik dava oluştur
    const davalar: Any[] = [];
    const belgeler: Record<string, Any[]> = {};

    if (body.dosya_no?.trim()) {
      const esasNo = body.dosya_no.trim();
      const demoData = buildDemoUyapData(esasNo);

      // Dava zaten var mı kontrol et
      const { data: existingCase } = await svc
        .from("cases")
        .select("id, title, case_number, court, status")
        .eq("lawyer_id", user.id)
        .eq("case_number", esasNo)
        .single();

      let caseId: string;
      if (existingCase) {
        caseId = existingCase.id;
        davalar.push(existingCase);
      } else {
        const { data: newCase, error: caseError } = await svc
          .from("cases")
          .insert({
            lawyer_id: user.id,
            client_id: result.clientId ?? null,
            title: demoData.davaTuru,
            case_number: esasNo,
            court: demoData.mahkemeAdi,
            case_type: demoData.davaTuru,
            status: "aktif",
            description: `UYAP otomatik entegre. Hakim: ${demoData.hakim}`,
            start_date: new Date(demoData.acilisTarihi).toISOString().split("T")[0],
            uyap_status: demoData.durumu,
            is_uyap_synced: true,
          })
          .select("id, title, case_number, court, status")
          .single();

        if (!caseError && newCase) {
          caseId = newCase.id;
          davalar.push(newCase);
        } else {
          caseId = "";
        }
      }

      // client_id bağla (eğer yoksa)
      if (caseId) {
        await svc.from("cases").update({ client_id: result.clientId }).eq("id", caseId).is("client_id", null);
        belgeler[caseId] = mockBelgeler(esasNo);
      }

      // uyap_synced güncelle
      await svc.from("clients").update({ uyap_synced: true }).eq("id", result.clientId);
    }

    // Yeni oluşturulan/güncellenen client'ı döndür
    const { data: clientData } = await svc
      .from("clients")
      .select("*")
      .eq("id", result.clientId)
      .single();

    return NextResponse.json({
      client: clientData,
      clientId: result.clientId,
      alreadyExists: result.alreadyExists ?? false,
      davalar,
      belgeler,
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
