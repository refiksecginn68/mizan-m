// Belge okuma motoru testi — gerçekçi UDF/PDF/DOCX üretir ve extractDocument ile okur.
// Çalıştır: npx tsx scripts/test-extract.ts
import JSZip from "jszip";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { extractDocument } from "../src/lib/services/document-extract";

const ORNEK_METIN = `İSTANBUL 5. ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI: Mehmet Yılmaz (T.C. 12345678901)
VEKİLİ: Av. Ayşe Demir
DAVALI: ABC İnşaat Ltd. Şti.

KONU: Ayıplı ifa nedeniyle 250.000 TL tazminat istemidir.

AÇIKLAMALAR:
1- Müvekkil ile davalı arasında 15.03.2024 tarihli inşaat sözleşmesi imzalanmıştır.
2- Davalı, teslim ettiği bağımsız bölümde projeye aykırı imalat yapmıştır.
3- Bilirkişi incelemesinde ayıplı imalat tespit edilmiştir.

HUKUKİ NEDENLER: TBK m. 112, 474 vd. ve ilgili mevzuat.

SONUÇ VE İSTEM: Davanın kabulü ile 250.000 TL tazminatın davalıdan tahsiline karar verilmesini saygıyla arz ve talep ederiz.`;

async function makeUdf(): Promise<Buffer> {
  // UYAP UDF: zip içinde content.xml, metin CDATA'da
  const zip = new JSZip();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<template format_id="1.8">
<content><![CDATA[${ORNEK_METIN}]]></content>
<properties><pageFormat mediaSizeName="1" leftMargin="70.875" rightMargin="70.875" topMargin="70.875" bottomMargin="70.875"/></properties>
<elements resolver="hvl-default"><paragraph><content startOffset="0" length="${ORNEK_METIN.length}"/></paragraph></elements>
<styles><style name="hvl-default" family="Times New Roman" size="12"/></styles>
</template>`;
  zip.file("content.xml", xml);
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

async function makePdf(): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595, 842]);
  // Helvetica Türkçe karakterleri desteklemez — WinAnsi dışı karakterleri sadeleştir
  const ascii = ORNEK_METIN
    .replace(/İ/g, "I").replace(/ı/g, "i").replace(/Ş/g, "S").replace(/ş/g, "s")
    .replace(/Ğ/g, "G").replace(/ğ/g, "g").replace(/Ü/g, "U").replace(/ü/g, "u")
    .replace(/Ö/g, "O").replace(/ö/g, "o").replace(/Ç/g, "C").replace(/ç/g, "c")
    .replace(/Â/g, "A").replace(/â/g, "a");
  let y = 800;
  for (const line of ascii.split("\n")) {
    if (y < 60) { page = pdf.addPage([595, 842]); y = 800; }
    page.drawText(line.slice(0, 90), { x: 50, y, size: 11, font });
    y -= 16;
  }
  return Buffer.from(await pdf.save());
}

async function makeDocx(): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      children: ORNEK_METIN.split("\n").map(
        (line) => new Paragraph({ children: [new TextRun(line)] })
      ),
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

async function main() {
  const tests: Array<[string, () => Promise<Buffer>]> = [
    ["ornek-dilekce.udf", makeUdf],
    ["ornek-dilekce.pdf", makePdf],
    ["ornek-dilekce.docx", makeDocx],
  ];
  let pass = 0;
  for (const [name, make] of tests) {
    const buf = await make();
    try {
      const res = await extractDocument(name, buf);
      const key = name.endsWith(".pdf") ? "ASLIYE HUKUK" : "ASLİYE HUKUK"; // pdf ascii'leştirildi
      const hasCore = res.text.includes(key) && /250\.000 TL/.test(res.text) && /TBK/.test(res.text);
      console.log(`${name}: kind=${res.kind} | ${buf.length}B girdi → ${res.text.length} karakter | içerik doğrulama (mahkeme+tutar+TBK): ${hasCore ? "✓" : "✗"}${res.warning ? " | UYARI: " + res.warning : ""}`);
      console.log(`  ilk 120 kr: ${res.text.slice(0, 120).replace(/\n/g, " ")}`);
      if (hasCore) pass++;
    } catch (e) {
      console.log(`${name}: HATA — ${e instanceof Error ? e.message : e}`);
    }
  }
  // Boş metin katmanlı PDF (taranmış senaryosu): sadece boş sayfa
  const emptyPdf = await PDFDocument.create();
  emptyPdf.addPage([595, 842]);
  const emptyBuf = Buffer.from(await emptyPdf.save());
  const res = await extractDocument("taranmis.pdf", emptyBuf);
  console.log(`taranmis.pdf (metin katmansız): uyarı verildi mi: ${res.warning ? "✓ — " + res.warning.slice(0, 80) : "✗"}`);
  console.log(`\n=== ${pass}/3 format başarıyla okundu ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
