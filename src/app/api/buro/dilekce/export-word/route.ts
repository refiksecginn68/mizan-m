import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, LevelFormat, convertInchesToTwip,
} from "docx";
import { createClient } from "@/lib/supabase/server";
import { htmlToBloklar, duzMetinBloklari, type Blok, type Run } from "@/lib/services/belge-modeli";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const VARSAYILAN_FONT = "Times New Roman";
const VARSAYILAN_PUNTO = 12;

const HIZA: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

const BASLIK_SEVIYE = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
} as const;

// #rrggbb → RRGGBB (docx renkleri diyezsiz bekler)
function renk(v?: string): string | undefined {
  return v ? v.replace("#", "").toUpperCase() : undefined;
}

function runYap(r: Run, blok: Blok): TextRun {
  const baslikMi = blok.tip === "h1" || blok.tip === "h2" || blok.tip === "h3";
  return new TextRun({
    text: r.text,
    bold: r.bold,
    italics: r.italic,
    underline: r.underline ? {} : undefined,
    strike: r.strike,
    color: renk(r.color),
    shading: r.vurgu ? { fill: renk(r.vurgu) } : undefined,
    font: r.font ?? VARSAYILAN_FONT,
    // docx yarım-punto ister: 12pt → 24. Başlıklarda punto stile bırakılır.
    size: r.punto ? Math.round(r.punto * 2) : baslikMi ? undefined : VARSAYILAN_PUNTO * 2,
  });
}

function paragrafYap(b: Blok): Paragraph {
  const bosMu = !b.runs.some((r) => r.text.trim());
  const listeMi = b.tip === "madde" || b.tip === "numara";

  return new Paragraph({
    children: bosMu ? [] : b.runs.map((r) => runYap(r, b)),
    heading: b.tip in BASLIK_SEVIYE ? BASLIK_SEVIYE[b.tip as keyof typeof BASLIK_SEVIYE] : undefined,
    alignment: b.hiza ? HIZA[b.hiza] : undefined,
    numbering: listeMi
      ? { reference: b.tip === "madde" ? "madde-listesi" : "numarali-liste", level: 0 }
      : undefined,
    // px → twip (1px ≈ 15 twip @96dpi)
    indent: !listeMi && b.girinti ? { left: b.girinti * 15 } : undefined,
    spacing: {
      after: 120,
      line: b.satirAraligi ? Math.round(b.satirAraligi * 240) : undefined,
    },
  });
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

    const bloklar: Blok[] = html ? htmlToBloklar(html) : duzMetinBloklari(metin ?? "");
    if (!bloklar.length) return Response.json({ error: "Belge içeriği çözümlenemedi" }, { status: 400 });

    const govde = bloklar.map(paragrafYap);

    // Başlık yalnızca kullanıcı verdiyse ve metin zaten başlıkla başlamıyorsa eklenir.
    // (Eskiden uzun "konu" metni olduğu gibi H1'e basılıyordu.)
    const ilkBlokBaslikMi = bloklar[0]?.tip.startsWith("h");
    const temizBaslik = (baslik ?? "").trim().split("\n")[0].slice(0, 120);
    const cocuklar =
      temizBaslik && !ilkBlokBaslikMi
        ? [
            new Paragraph({
              children: [new TextRun({ text: temizBaslik, bold: true, font: VARSAYILAN_FONT, size: 28 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            ...govde,
          ]
        : govde;

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "madde-listesi",
            levels: [{
              level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
            }],
          },
          {
            reference: "numarali-liste",
            levels: [{
              level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
            }],
          },
        ],
      },
      sections: [{
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: cocuklar,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="dilekce.docx"',
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("export-word hatası:", err);
    return Response.json({ error: "Word belgesi oluşturulamadı" }, { status: 500 });
  }
}
