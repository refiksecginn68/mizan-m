import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const DOC_TYPE_LABELS: Record<string, string> = {
  dilekce: "Dilekçe",
  savunma: "Savunma",
  itiraz: "İtiraz",
  beyan: "Beyan",
};

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
      .select("user_type, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "avukat") {
      return NextResponse.json({ error: "Bu özellik sadece avukatlar içindir" }, { status: 403 });
    }

    const body = await req.json();
    const { caseId, docType, content } = body as { caseId?: string; docType: string; content: string };

    if (!docType || !content) {
      return NextResponse.json({ error: "Belge türü ve içerik zorunludur" }, { status: 400 });
    }

    // Dava bilgisini çek (varsa)
    let caseTitle = "";
    let esasNo = "";
    if (caseId) {
      const { data: caseData } = await serviceSupabase
        .from("cases")
        .select("title, case_number")
        .eq("id", caseId)
        .eq("lawyer_id", user.id)
        .single();
      if (caseData) {
        caseTitle = caseData.title || "";
        esasNo = caseData.case_number || "";
      }
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("tr-TR");
    const timeStr = now.toLocaleTimeString("tr-TR");
    const docTypeLabel = DOC_TYPE_LABELS[docType] || docType;

    // UDF formatı XML tabanlıdır
    const udfXml = `<?xml version="1.0" encoding="UTF-8"?>
<UDFDocument version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <DocType>${docTypeLabel}</DocType>
    <CreatedAt>${now.toISOString()}</CreatedAt>
    <CreatedDate>${dateStr}</CreatedDate>
    <CreatedTime>${timeStr}</CreatedTime>
    <Author>${profile.full_name}</Author>
    <System>Mizanım Hukuk Platformu</System>
    <SystemVersion>1.0</SystemVersion>
    ${caseTitle ? `<CaseTitle>${escapeXml(caseTitle)}</CaseTitle>` : ""}
    ${esasNo ? `<EsasNo>${escapeXml(esasNo)}</EsasNo>` : ""}
  </Header>
  <Content><![CDATA[${content}]]></Content>
  <Footer>
    <System>Mizanım</System>
    <Website>mizanim.com</Website>
    <Disclaimer>Bu belge Mizanım (mizanim.com) tarafından üretilmiştir. Hukuki tavsiye niteliği taşımaz.</Disclaimer>
    <GeneratedAt>${now.toISOString()}</GeneratedAt>
  </Footer>
</UDFDocument>`;

    const safeDocType = docType.replace(/[^a-z0-9]/gi, "_");
    const filename = `mizanim_${safeDocType}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.udf`;

    return new NextResponse(udfXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-UDF-DocType": docTypeLabel,
        "X-UDF-Note": "UYAP UDF formatı - e-imza ile imzalandıktan sonra yükleyiniz",
      },
    });
  } catch (err) {
    console.error("UDF hazirla error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
