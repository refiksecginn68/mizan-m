import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { metin, baslik } = await request.json() as { metin: string; baslik: string };

  const lines = metin.split("\n");
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: baslik || "Dilekçe",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  for (const line of lines) {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: "", spacing: { after: 120 } }));
    } else {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 24, font: "Times New Roman" })],
          spacing: { after: 120 },
          indent: { firstLine: 720 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: paragraphs,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new Response(uint8, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="dilekce.docx"`,
    },
  });
}
