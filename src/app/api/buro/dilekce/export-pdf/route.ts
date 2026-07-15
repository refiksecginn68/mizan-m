import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { createClient } from "@/lib/supabase/server";
import { readFile } from "fs/promises";
import path from "path";
import { htmlToBloklar, duzMetinBloklari, type Blok, type Run } from "@/lib/services/belge-modeli";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 70;
const VARSAYILAN_PUNTO = 11;

// Ölçülmüş run parçası — satıra yerleştirilmeye hazır
interface Parca {
  text: string;
  font: PDFFont;
  punto: number;
  renk: ReturnType<typeof rgb>;
  vurgu?: ReturnType<typeof rgb>;
  altCizili: boolean;
  ustCizili: boolean;
  genislik: number;
}

function hexRgb(hex: string | undefined, varsayilan: ReturnType<typeof rgb>) {
  if (!hex) return varsayilan;
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return varsayilan;
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
}

export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Oturum bulunamadı" }, { status: 401 });

    const { metin, html, baslik } = (await request.json()) as {
      metin?: string; html?: string; baslik?: string;
    };

    const kaynak = (html ?? metin ?? "").trim();
    if (!kaynak) return Response.json({ error: "Belge içeriği boş" }, { status: 400 });

    let bloklar: Blok[] = html ? htmlToBloklar(html) : duzMetinBloklari(metin ?? "");
    if (!bloklar.length) return Response.json({ error: "Belge içeriği çözümlenemedi" }, { status: 400 });

    const temizBaslik = (baslik ?? "").trim().split("\n")[0].slice(0, 120);
    if (temizBaslik && !bloklar[0]?.tip.startsWith("h")) {
      bloklar = [{ tip: "h1", runs: [{ text: temizBaslik, bold: true }], hiza: "center" }, ...bloklar];
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Türkçe karakter desteği: DejaVu (StandardFonts WinAnsi ğ/ş/ı encode edemez)
    const fontYolu = (ad: string) => path.join(process.cwd(), "public", "fonts", ad);
    const [duz, kalin, italik, kalinItalik] = await Promise.all([
      pdfDoc.embedFont(await readFile(fontYolu("DejaVuSans.ttf")), { subset: true }),
      pdfDoc.embedFont(await readFile(fontYolu("DejaVuSans-Bold.ttf")), { subset: true }),
      pdfDoc.embedFont(await readFile(fontYolu("DejaVuSans-Oblique.ttf")), { subset: true }),
      pdfDoc.embedFont(await readFile(fontYolu("DejaVuSans-BoldOblique.ttf")), { subset: true }),
    ]);
    const fontSec = (r: Run) =>
      r.bold && r.italic ? kalinItalik : r.bold ? kalin : r.italic ? italik : duz;

    const SIYAH = rgb(0.1, 0.1, 0.1);
    let page: PDFPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;
    const kullanilabilir = PAGE_W - MARGIN * 2;

    const yeniSayfa = () => {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    };

    let sayac = 0;
    for (const b of bloklar) {
      if (b.tip !== "numara") sayac = 0;
      const baslikMi = b.tip === "h1" || b.tip === "h2" || b.tip === "h3";
      const bloguPunto = baslikMi ? (b.tip === "h1" ? 15 : b.tip === "h2" ? 13 : 12) : VARSAYILAN_PUNTO;
      const satirYuk = (b.satirAraligi ?? 1.5) * bloguPunto;
      const girinti = b.girinti ? b.girinti * 0.75 : 0;

      if (!b.runs.some((r) => r.text.trim())) {
        y -= satirYuk * 0.6;
        continue;
      }

      // Blok metnini kelime kelime ölçülmüş parçalara böl
      const onEk = b.tip === "madde" ? "• " : b.tip === "numara" ? `${++sayac}. ` : "";
      const kelimeler: Parca[] = [];
      const hepsi: Run[] = onEk ? [{ text: onEk, bold: false }, ...b.runs] : b.runs;

      for (const r of hepsi) {
        const f = fontSec({ ...r, bold: r.bold || baslikMi });
        const punto = r.punto ?? bloguPunto;
        const renk = hexRgb(r.color, SIYAH);
        const vurgu = r.vurgu ? hexRgb(r.vurgu, SIYAH) : undefined;
        // Kelime sınırlarını koruyarak böl (boşluklar kelimeye iliştirilir)
        for (const kelime of r.text.split(/(?<= )/)) {
          if (!kelime) continue;
          kelimeler.push({
            text: kelime, font: f, punto, renk, vurgu,
            altCizili: !!r.underline, ustCizili: !!r.strike,
            genislik: f.widthOfTextAtSize(kelime, punto),
          });
        }
      }

      // Satırlara sar — gerçek genişlik ölçümüyle
      const satirlar: Parca[][] = [];
      let satir: Parca[] = [];
      let genislik = 0;
      for (const k of kelimeler) {
        if (satir.length && genislik + k.genislik > kullanilabilir - girinti) {
          satirlar.push(satir);
          satir = [];
          genislik = 0;
        }
        satir.push(k);
        genislik += k.genislik;
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
            page.drawRectangle({
              x, y: y - k.punto * 0.25, width: k.genislik, height: k.punto * 1.15,
              color: k.vurgu,
            });
          }
          page.drawText(k.text, { x, y, size: k.punto, font: k.font, color: k.renk });
          if (k.altCizili) {
            page.drawLine({
              start: { x, y: y - 2 }, end: { x: x + k.genislik, y: y - 2 },
              thickness: 0.6, color: k.renk,
            });
          }
          if (k.ustCizili) {
            page.drawLine({
              start: { x, y: y + k.punto * 0.3 }, end: { x: x + k.genislik, y: y + k.punto * 0.3 },
              thickness: 0.6, color: k.renk,
            });
          }
          x += k.genislik;
        }
        y -= satirYuk;
      }
      y -= satirYuk * 0.25;
    }

    // Sayfa numaraları
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const label = `${i + 1} / ${pages.length}`;
      const lw = duz.widthOfTextAtSize(label, 9);
      pages[i].drawText(label, {
        x: (PAGE_W - lw) / 2, y: 30, size: 9, font: duz, color: rgb(0.6, 0.6, 0.6),
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="dilekce.pdf"',
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (err) {
    console.error("export-pdf hatası:", err);
    return Response.json({ error: "PDF belgesi oluşturulamadı" }, { status: 500 });
  }
}
