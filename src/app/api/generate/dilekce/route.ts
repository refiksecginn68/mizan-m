import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkAndConsumeQuota, refundQuota, QUOTA_EXHAUSTED_BODY } from "@/lib/quota";
import { dilekceMetniTemizle } from "@/lib/services/dilekce-temizle";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Türkçe desteği olan font — CDN'den bir kere çekilir, bellekte tutulur
let cachedTurkishFont: ArrayBuffer | null = null;

async function getTurkishFont(): Promise<ArrayBuffer | null> {
  if (cachedTurkishFont) return cachedTurkishFont;
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.1.1/files/noto-sans-all-400-normal.woff2",
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    cachedTurkishFont = await res.arrayBuffer();
    return cachedTurkishFont;
  } catch {
    return null;
  }
}

const DILEKCE_PROMPTS: Record<string, string> = {
  ihtarname: "Türk hukuku ihtarnamesi (Noter veya iadeli taahhütlü posta ile gönderilecek resmi uyarı belgesi)",
  sikayet_dilekce: "Cumhuriyet Başsavcılığı'na veya ilgili idari makama hitaben şikayet dilekçesi",
  itiraz_dilekce: "İdare mahkemesi veya üst makama itiraz dilekçesi",
  is_tazminat: "İş Mahkemesi'ne kıdem/ihbar tazminatı veya işe iade davası dilekçesi",
  kira_tahliye: "Sulh Hukuk Mahkemesi'ne kira uyuşmazlığı dilekçesi",
  tuketici_sikayet: "Tüketici Hakem Heyeti'ne tüketici şikayet dilekçesi",
  nafaka: "Aile Mahkemesi'ne nafaka talep/değişiklik dilekçesi",
  vekaletname_talep: "İlgili kurum veya şirkete belge/bilgi talep dilekçesi",
};

function replaceTurkishChars(text: string): string {
  return text
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ü/g, "u").replace(/Ü/g, "U");
}

async function generatePDF(title: string, content: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Türkçe font denemesi — başarısız olursa Helvetica + transliteration
  const turkishFontBytes = await getTurkishFont();
  let font: Awaited<ReturnType<typeof pdfDoc.embedFont>>;
  let boldFont: Awaited<ReturnType<typeof pdfDoc.embedFont>>;
  let useTurkishFont = false;

  if (turkishFontBytes) {
    pdfDoc.registerFontkit(fontkit);
    font = await pdfDoc.embedFont(turkishFontBytes);
    boldFont = font; // Noto Sans tek ağırlıklı, bold için aynı font
    useTurkishFont = true;
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 72;
  const contentWidth = pageWidth - margin * 2;
  const fontSize = 10;
  const lineHeight = 16;
  const titleFontSize = 13;

  // Türkçe font varsa orijinal metin, yoksa transliteration
  const safeTitle = useTurkishFont ? title : replaceTurkishChars(title);
  const safeContent = useTurkishFont ? content : replaceTurkishChars(content);

  function wrapText(text: string, maxWidth: number, f = font, size = fontSize): string[] {
    const lines: string[] = [];
    const paragraphs = text.split("\n");
    for (const para of paragraphs) {
      if (!para.trim()) { lines.push(""); continue; }
      const words = para.split(" ");
      let currentLine = "";
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        const w = f.widthOfTextAtSize(test, size);
        if (w > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function checkNewPage(neededHeight: number) {
    if (y - neededHeight < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      // Footer
      page.drawText("Mizanim - mizanim.com | Bu belge hukuki tavsiye niteliginde degildir.", {
        x: margin,
        y: margin / 2,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }

  // Header çizgisi
  page.drawRectangle({
    x: margin,
    y: pageHeight - margin + 20,
    width: contentWidth,
    height: 2,
    color: rgb(0.1, 0.15, 0.27), // primary
  });

  // Footer
  page.drawText("Mizanim - mizanim.com | Bu belge hukuki tavsiye niteliginde degildir.", {
    x: margin,
    y: margin / 2,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Başlık
  const titleLines = wrapText(safeTitle.toUpperCase(), contentWidth, boldFont, titleFontSize);
  for (const line of titleLines) {
    checkNewPage(titleFontSize + 8);
    page.drawText(line, { x: margin, y, size: titleFontSize, font: boldFont, color: rgb(0.1, 0.15, 0.27) });
    y -= titleFontSize + 8;
  }

  y -= 10; // boşluk

  // Ayraç
  page.drawRectangle({ x: margin, y, width: contentWidth, height: 0.5, color: rgb(0.79, 0.66, 0.3) });
  y -= 16;

  // İçerik
  const contentLines = wrapText(safeContent, contentWidth);
  for (const line of contentLines) {
    checkNewPage(lineHeight);
    if (line) {
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
    }
    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userClient = createClient() as any;
    const { data: { user } } = await userClient.auth.getUser();

    if (!user) {
      return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const body = await request.json() as {
      type: string;
      data: Record<string, string>;
    };

    if (!body.type || !body.data) {
      return Response.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    // Sorgu kotası harcaması (AI çağrısı = 1 kota)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceClient = createServiceClient() as any;
    const hasQuota = await checkAndConsumeQuota(user.id);
    if (!hasQuota) {
      return Response.json(QUOTA_EXHAUSTED_BODY, { status: 402 });
    }

    const docType = DILEKCE_PROMPTS[body.type] ?? "resmi dilekçe";
    const dataStr = Object.entries(body.data)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPrompt = `Sen Türk hukuku alanında uzman bir hukuk asistanısın.
Kullanıcıdan alınan bilgilere göre ${docType} hazırlıyorsun.

KURALLAR:
- Türk hukuku ve usulüne uygun resmi dil kullan
- Dilekçenin tüm standart bölümlerini dahil et (başlık, hitap, açıklama, talep, imza)
- Hukuki dayanakları belirt (kanun maddeleri)
- Sadece dilekçe metnini yaz, ek açıklama yapma
- Profesyonel ve resmi Türkçe kullan
- Markdown KULLANMA: #, ##, *, **, -, \`\`\`, | işaretleri YASAK — çıktı kağıda basılacak düz dilekçe metnidir; vurgu gerekiyorsa BÜYÜK HARF kullan
- Dilekçenin sonuna şu uyarıyı ekle: "Bu dilekçe Mizanım AI tarafından üretilmiştir. Hukuki tavsiye niteliği taşımaz."`;

    const userMessage = `Aşağıdaki bilgilere göre ${docType} hazırla:\n\n${dataStr}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const dilekceText = dilekceMetniTemizle(response.content[0].type === "text" ? response.content[0].text : "");

    if (!dilekceText) {
      // Başarısız çağrı kotadan yemez
      await refundQuota(user.id);
      return Response.json({ error: "Dilekçe oluşturulamadı" }, { status: 500 });
    }

    // PDF oluştur
    const typeLabelMap: Record<string, string> = {
      ihtarname: "İhtarname",
      sikayet_dilekce: "Şikayet Dilekçesi",
      itiraz_dilekce: "İtiraz Dilekçesi",
      is_tazminat: "İş Tazminatı Dilekçesi",
      kira_tahliye: "Kira Uyuşmazlığı Dilekçesi",
      tuketici_sikayet: "Tüketici Şikayet Dilekçesi",
      nafaka: "Nafaka Dilekçesi",
      vekaletname_talep: "Belge Talep Dilekçesi",
    };
    const docTitle = typeLabelMap[body.type] ?? "Dilekçe";

    let pdfUrl: string | null = null;
    try {
      const pdfBuffer = await generatePDF(docTitle, dilekceText);
      const storagePath = `${user.id}/generated/${Date.now()}-dilekce.pdf`;

      const { error: uploadErr } = await serviceClient.storage
        .from("generated-documents")
        .upload(storagePath, pdfBuffer, { contentType: "application/pdf" });

      if (!uploadErr) {
        const { data: publicUrlData } = serviceClient.storage
          .from("generated-documents")
          .getPublicUrl(storagePath);
        pdfUrl = publicUrlData?.publicUrl ?? null;
      }
    } catch {
      // PDF veya storage hatası — metin yanıt yine döner
    }

    // DB kayıt
    await serviceClient.from("generated_documents").insert({
      user_id: user.id,
      title: docTitle,
      document_type: body.type,
      content: dilekceText,
      pdf_path: pdfUrl,
    });

    return Response.json({ text: dilekceText, pdfUrl });
  } catch (err) {
    console.error("Generate dilekce error:", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
