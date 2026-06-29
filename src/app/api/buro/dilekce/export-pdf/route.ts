import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 70;
const LINE_H = 18;
const FONT_SIZE = 11;
const TITLE_SIZE = 13;

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { metin, baslik } = await request.json() as { metin: string; baslik: string };

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const maxChars = Math.floor((PAGE_W - MARGIN * 2) / (FONT_SIZE * 0.55));
  const contentLines = metin.split("\n");

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // Başlık
  const titleText = (baslik || "DİLEKÇE").toUpperCase();
  const titleW = boldFont.widthOfTextAtSize(titleText, TITLE_SIZE);
  page.drawText(titleText, {
    x: (PAGE_W - titleW) / 2,
    y,
    size: TITLE_SIZE,
    font: boldFont,
    color: rgb(0.06, 0.09, 0.16),
  });
  y -= LINE_H * 2;

  // Ayırıcı çizgi
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= LINE_H * 1.5;

  for (const rawLine of contentLines) {
    if (y < MARGIN + LINE_H * 2) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }

    if (!rawLine.trim()) {
      y -= LINE_H * 0.5;
      continue;
    }

    const wrapped = rawLine.length > maxChars ? wrapText(rawLine, maxChars) : [rawLine];
    for (const wl of wrapped) {
      if (y < MARGIN + LINE_H) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      }
      page.drawText(wl, {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= LINE_H;
    }
  }

  // Sayfa numaraları
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const label = `${i + 1} / ${pages.length}`;
    const lw = font.widthOfTextAtSize(label, 9);
    p.drawText(label, {
      x: (PAGE_W - lw) / 2,
      y: 30,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dilekce.pdf"`,
    },
  });
}
