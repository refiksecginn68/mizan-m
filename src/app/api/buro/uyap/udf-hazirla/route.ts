import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import JSZip from "jszip";

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
    const docTypeLabel = DOC_TYPE_LABELS[docType] || docType;

    // Belge metni: başlıkta dava bilgisi varsa ekle
    const fullText = [
      caseTitle ? `${caseTitle}${esasNo ? ` (Esas No: ${esasNo})` : ""}` : "",
      content,
    ].filter(Boolean).join("\n\n");

    // Gerçek UYAP UDF formatı: ZIP arşivi içinde format_id="1.8" şemalı content.xml.
    // Metnin tamamı <content> CDATA'sında durur; <elements> altındaki paragraflar
    // bu metne startOffset/length ile referans verir.
    const normalized = fullText.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");
    let offset = 0;
    const paragraphs: string[] = [];
    for (const line of lines) {
      const len = line.length + 1; // satır + '\n'
      paragraphs.push(
        `<paragraph Alignment="0" LeftIndent="0.0" RightIndent="0.0"><content startOffset="${offset}" length="${len}" /></paragraph>`
      );
      offset += len;
    }
    const cdataText = lines.map((l) => l + "\n").join("");

    const contentXml = `<?xml version="1.0" encoding="UTF-8" ?>
<template format_id="1.8">
<content><![CDATA[${cdataText.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]></content>
<properties><pageFormat mediaSizeName="1" leftMargin="70.875" rightMargin="70.875" topMargin="70.875" bottomMargin="70.875" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>
<elements resolver="hvl-default">
${paragraphs.join("\n")}
</elements>
<styles>
<style name="default" description="Geçerli" family="Dialog" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="Dialog" />
<style name="hvl-default" family="Times New Roman" size="12" description="Gövde" />
</styles>
</template>`;

    const zip = new JSZip();
    zip.file("content.xml", contentXml);
    const udfBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    const safeDocType = docType.replace(/[^a-z0-9]/gi, "_");
    const filename = `mizanim_${safeDocType}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.udf`;

    return new NextResponse(new Uint8Array(udfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // HTTP header degerleri Latin-1 olmali — Turkce karakter kullanma
        "X-UDF-DocType": encodeURIComponent(docTypeLabel),
        "X-UDF-Note": "UYAP UDF formati - e-imza ile imzalandiktan sonra yukleyiniz",
      },
    });
  } catch (err) {
    console.error("UDF hazirla error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
