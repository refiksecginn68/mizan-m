// Blok modelinden belge üretimi — PDF, Word (docx), UDF (UYAP).
// Üretici mantığı dilekçe export route'larından buraya taşındı; hem o route'lar
// hem de Hesaplama > Dönüştürücü aynı kanıtlı üreticiyi kullanır (tek kaynak).
import JSZip from "jszip";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import path from "path";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, LevelFormat, convertInchesToTwip,
} from "docx";
import type { Blok, Run } from "./belge-modeli";

// ============ UDF (UYAP) ============
// UDF, ZIP arşivi içinde format_id="1.8" şemalı content.xml'dir. Metnin tamamı
// <content> CDATA'sında durur; paragraflar startOffset/length ile referans verir.
const HIZA_KODU: Record<string, number> = { left: 0, center: 1, right: 2, justify: 3 };

function javaRenk(hex?: string): number | undefined {
  if (!hex) return undefined;
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return undefined;
  return (0xff000000 | parseInt(m[1], 16)) | 0;
}
function xmlKacis(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function cdataKacis(s: string): string {
  return s.replace(/\]\]>/g, "]]]]><![CDATA[>");
}

export function blokToUdfXml(bloklar: Blok[], varsayilanFont = "Times New Roman", varsayilanPunto = 12): string {
  let govde = "";
  let offset = 0;
  const paragraflar: string[] = [];
  let sayac = 0;

  for (const b of bloklar) {
    if (b.tip !== "numara") sayac = 0;
    const onEk = b.tip === "madde" ? "• " : b.tip === "numara" ? `${++sayac}. ` : "";
    const contentler: string[] = [];

    if (onEk) {
      govde += onEk;
      contentler.push(`<content startOffset="${offset}" length="${onEk.length}" />`);
      offset += onEk.length;
    }

    for (const r of b.runs) {
      if (!r.text) continue;
      govde += r.text;
      const baslikMi = b.tip === "h1" || b.tip === "h2" || b.tip === "h3";
      const punto = r.punto ?? (baslikMi ? varsayilanPunto + 2 : varsayilanPunto);
      const nitelik = [
        `startOffset="${offset}"`,
        `length="${r.text.length}"`,
        `family="${xmlKacis(r.font ?? varsayilanFont)}"`,
        `size="${Math.round(punto)}"`,
        (r.bold || baslikMi) ? 'bold="true"' : "",
        r.italic ? 'italic="true"' : "",
        r.underline ? 'underline="true"' : "",
        r.strike ? 'strikethrough="true"' : "",
        javaRenk(r.color) !== undefined ? `foreground="${javaRenk(r.color)}"` : "",
      ].filter(Boolean).join(" ");
      contentler.push(`<content ${nitelik} />`);
      offset += r.text.length;
    }

    govde += "\n";
    const sonUzunluk = 1;
    if (!contentler.length) {
      contentler.push(`<content startOffset="${offset}" length="${sonUzunluk}" />`);
      offset += sonUzunluk;
    } else {
      const son = contentler.pop()!;
      const m = son.match(/length="(\d+)"/)!;
      contentler.push(son.replace(/length="\d+"/, `length="${Number(m[1]) + sonUzunluk}"`));
      offset += sonUzunluk;
    }

    const hiza = HIZA_KODU[b.hiza ?? "left"] ?? 0;
    const solGirinti = b.girinti ? (b.girinti * 0.75).toFixed(1) : "0.0";
    paragraflar.push(
      `<paragraph Alignment="${hiza}" LeftIndent="${solGirinti}" RightIndent="0.0">${contentler.join("")}</paragraph>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8" ?>
<template format_id="1.8">
<content><![CDATA[${cdataKacis(govde)}]]></content>
<properties><pageFormat mediaSizeName="1" leftMargin="70.875" rightMargin="70.875" topMargin="70.875" bottomMargin="70.875" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>
<elements resolver="hvl-default">
${paragraflar.join("\n")}
</elements>
<styles>
<style name="default" description="Geçerli" family="Dialog" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="Dialog" />
<style name="hvl-default" family="${xmlKacis(varsayilanFont)}" size="${varsayilanPunto}" description="Gövde" />
</styles>
</template>`;
}

export async function blokToUdf(bloklar: Blok[]): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("content.xml", blokToUdfXml(bloklar, "Times New Roman", 12));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// ============ PDF (pdf-lib + DejaVu, Türkçe destekli) ============
const PAGE_W = 595, PAGE_H = 842, MARGIN = 70, PDF_PUNTO = 11;

interface Parca {
  text: string; font: PDFFont; punto: number;
  renk: ReturnType<typeof rgb>; vurgu?: ReturnType<typeof rgb>;
  altCizili: boolean; ustCizili: boolean; genislik: number;
}
function hexRgb(hex: string | undefined, varsayilan: ReturnType<typeof rgb>) {
  if (!hex) return varsayilan;
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return varsayilan;
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
}

export async function blokToPdf(bloklar: Blok[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontYolu = (ad: string) => path.join(process.cwd(), "public", "fonts", ad);
  const [duz, kalin, italik, kalinItalik] = await Promise.all([
    pdfDoc.embedFont(await readFile(fontYolu("DejaVuSans.ttf")), { subset: true }),
    pdfDoc.embedFont(await readFile(fontYolu("DejaVuSans-Bold.ttf")), { subset: true }),
    pdfDoc.embedFont(await readFile(fontYolu("DejaVuSans-Oblique.ttf")), { subset: true }),
    pdfDoc.embedFont(await readFile(fontYolu("DejaVuSans-BoldOblique.ttf")), { subset: true }),
  ]);
  const fontSec = (r: Run) => (r.bold && r.italic ? kalinItalik : r.bold ? kalin : r.italic ? italik : duz);
  const SIYAH = rgb(0.1, 0.1, 0.1);
  let page: PDFPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const kullanilabilir = PAGE_W - MARGIN * 2;
  const yeniSayfa = () => { page = pdfDoc.addPage([PAGE_W, PAGE_H]); y = PAGE_H - MARGIN; };

  let sayac = 0;
  for (const b of bloklar) {
    if (b.tip !== "numara") sayac = 0;
    const baslikMi = b.tip === "h1" || b.tip === "h2" || b.tip === "h3";
    const bloguPunto = baslikMi ? (b.tip === "h1" ? 15 : b.tip === "h2" ? 13 : 12) : PDF_PUNTO;
    const satirYuk = (b.satirAraligi ?? 1.5) * bloguPunto;
    const girinti = b.girinti ? b.girinti * 0.75 : 0;

    if (!b.runs.some((r) => r.text.trim())) { y -= satirYuk * 0.6; continue; }

    const onEk = b.tip === "madde" ? "• " : b.tip === "numara" ? `${++sayac}. ` : "";
    const kelimeler: Parca[] = [];
    const hepsi: Run[] = onEk ? [{ text: onEk, bold: false }, ...b.runs] : b.runs;

    for (const r of hepsi) {
      const f = fontSec({ ...r, bold: r.bold || baslikMi });
      const punto = r.punto ?? bloguPunto;
      const renk = hexRgb(r.color, SIYAH);
      const vurgu = r.vurgu ? hexRgb(r.vurgu, SIYAH) : undefined;
      for (const kelime of r.text.split(/(?<= )/)) {
        if (!kelime) continue;
        kelimeler.push({
          text: kelime, font: f, punto, renk, vurgu,
          altCizili: !!r.underline, ustCizili: !!r.strike,
          genislik: f.widthOfTextAtSize(kelime, punto),
        });
      }
    }

    const satirlar: Parca[][] = [];
    let satir: Parca[] = [];
    let genislik = 0;
    for (const k of kelimeler) {
      if (satir.length && genislik + k.genislik > kullanilabilir - girinti) {
        satirlar.push(satir); satir = []; genislik = 0;
      }
      satir.push(k); genislik += k.genislik;
    }
    if (satir.length) satirlar.push(satir);

    for (const s of satirlar) {
      if (y < MARGIN + satirYuk) yeniSayfa();
      const toplam = s.reduce((a, k) => a + k.genislik, 0);
      let x = MARGIN + girinti;
      if (b.hiza === "center") x = MARGIN + (kullanilabilir - toplam) / 2;
      else if (b.hiza === "right") x = PAGE_W - MARGIN - toplam;

      for (const k of s) {
        if (k.vurgu) {
          page.drawRectangle({ x, y: y - k.punto * 0.25, width: k.genislik, height: k.punto * 1.15, color: k.vurgu });
        }
        page.drawText(k.text, { x, y, size: k.punto, font: k.font, color: k.renk });
        if (k.altCizili) page.drawLine({ start: { x, y: y - 2 }, end: { x: x + k.genislik, y: y - 2 }, thickness: 0.6, color: k.renk });
        if (k.ustCizili) page.drawLine({ start: { x, y: y + k.punto * 0.3 }, end: { x: x + k.genislik, y: y + k.punto * 0.3 }, thickness: 0.6, color: k.renk });
        x += k.genislik;
      }
      y -= satirYuk;
    }
    y -= satirYuk * 0.25;
  }

  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const label = `${i + 1} / ${pages.length}`;
    const lw = duz.widthOfTextAtSize(label, 9);
    pages[i].drawText(label, { x: (PAGE_W - lw) / 2, y: 30, size: 9, font: duz, color: rgb(0.6, 0.6, 0.6) });
  }
  return pdfDoc.save();
}

// ============ Word (docx) ============
const W_FONT = "Times New Roman", W_PUNTO = 12;
const W_HIZA: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED,
};
const W_BASLIK = { h1: HeadingLevel.HEADING_1, h2: HeadingLevel.HEADING_2, h3: HeadingLevel.HEADING_3 } as const;
function wRenk(v?: string): string | undefined { return v ? v.replace("#", "").toUpperCase() : undefined; }

function wRun(r: Run, blok: Blok): TextRun {
  const baslikMi = blok.tip === "h1" || blok.tip === "h2" || blok.tip === "h3";
  return new TextRun({
    text: r.text, bold: r.bold, italics: r.italic,
    underline: r.underline ? {} : undefined, strike: r.strike,
    color: wRenk(r.color), shading: r.vurgu ? { fill: wRenk(r.vurgu) } : undefined,
    font: r.font ?? W_FONT,
    size: r.punto ? Math.round(r.punto * 2) : baslikMi ? undefined : W_PUNTO * 2,
  });
}
function wParagraf(b: Blok): Paragraph {
  const bosMu = !b.runs.some((r) => r.text.trim());
  const listeMi = b.tip === "madde" || b.tip === "numara";
  return new Paragraph({
    children: bosMu ? [] : b.runs.map((r) => wRun(r, b)),
    heading: b.tip in W_BASLIK ? W_BASLIK[b.tip as keyof typeof W_BASLIK] : undefined,
    alignment: b.hiza ? W_HIZA[b.hiza] : undefined,
    numbering: listeMi ? { reference: b.tip === "madde" ? "madde-listesi" : "numarali-liste", level: 0 } : undefined,
    indent: !listeMi && b.girinti ? { left: b.girinti * 15 } : undefined,
    spacing: { after: 120, line: b.satirAraligi ? Math.round(b.satirAraligi * 240) : undefined },
  });
}

export async function blokToDocx(bloklar: Blok[]): Promise<Buffer> {
  const doc = new Document({
    numbering: {
      config: [
        { reference: "madde-listesi", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } }] },
        { reference: "numarali-liste", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } }] },
      ],
    },
    sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: bloklar.map(wParagraf) }],
  });
  return Packer.toBuffer(doc);
}
