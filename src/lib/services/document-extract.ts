// Belge metin çıkarma servisi — UDF (UYAP), PDF (metin + OCR), DOCX, DOC, görsel (OCR), TXT
// UDF: içinde content.xml bulunan bir ZIP arşividir; metin CDATA içindedir.

import JSZip from "jszip";
import Anthropic from "@anthropic-ai/sdk";

export interface ExtractResult {
  text: string;
  kind: "udf" | "pdf" | "docx" | "doc" | "gorsel" | "txt";
  warning?: string;
  ocr?: boolean;
}

const OCR_MODEL = "claude-sonnet-4-6";
const OCR_TALIMAT =
  "Bu bir Türkçe hukuki belgedir. Belgedeki TÜM metni olduğu gibi, satır ve paragraf " +
  "yapısını koruyarak yaz. Türkçe karakterleri (ğ, ş, ı, İ, ç, ö, ü) doğru kullan. " +
  "Yorum, özet veya açıklama ekleme; markdown işareti kullanma. Yalnızca belgedeki metni döndür. " +
  "Metin okunamıyorsa sadece OKUNAMADI yaz.";

const GORSEL_TIPLERI: Record<string, "image/png" | "image/jpeg" | "image/gif" | "image/webp"> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
};

function anthropicIstemci(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

// Vision yanıtından düz metni toplar
function yanitMetni(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((c): c is Anthropic.Messages.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();
}

// Blok sınırı sayılan etiketler — yalnızca bunlar satır sonuna dönüşür
const BLOCK_TAGS = /^\/?(paragraph|p|div|br|tr|li|section|title|heading|h[1-6])\b/i;

// XML/HTML etiketlerini temizleyip düz metne indirger.
// Etiketler boşlukla DEĞİL, boş dizeyle değiştirilir: <span>m</span><span>e</span>
// gibi karakter/run bazlı işaretleme "m e t i n" gibi harf arası boşluk üretmesin.
// Satır yapısı yalnızca blok düzeyi etiketlerden türetilir.
function stripXml(xml: string): string {
  return xml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\?[\s\S]*?\?>/g, "")
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<([^\s/>]+)[^>]*?>/g, (tag, name: string) =>
      BLOCK_TAGS.test(name) ? "\n" : ""
    )
    .replace(/<\/([^\s>]+)\s*>/g, (tag, name: string) =>
      BLOCK_TAGS.test(name) ? "\n" : ""
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// UDF: ZIP → content.xml → CDATA (yoksa XML gövdesi)
export async function extractUdf(buffer: Buffer): Promise<ExtractResult> {
  const zip = await JSZip.loadAsync(buffer);
  const contentFile = zip.file("content.xml");
  if (!contentFile) {
    throw new Error("UDF içinde content.xml bulunamadı — dosya bozuk olabilir");
  }
  const xml = await contentFile.async("string");
  // UDF metni <content><![CDATA[...]]></content> içinde tutar
  const cdataMatches = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/g);
  let text: string;
  if (cdataMatches && cdataMatches.length > 0) {
    text = cdataMatches
      .map((m) => m.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, ""))
      .join("\n")
      .trim();
  } else {
    text = stripXml(xml);
  }
  return { text, kind: "udf" };
}

// Görsel (ekran görüntüsü/foto): Claude vision ile OCR
export async function extractGorsel(fileName: string, buffer: Buffer): Promise<ExtractResult> {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  const mediaType = GORSEL_TIPLERI[ext];
  if (!mediaType) throw new Error(`Desteklenmeyen görsel biçimi: .${ext}`);

  const istemci = anthropicIstemci();
  if (!istemci) {
    return {
      text: "", kind: "gorsel",
      warning: "Görsel okuma için AI servisi yapılandırılmamış (ANTHROPIC_API_KEY yok).",
    };
  }

  const res = await istemci.messages.create({
    model: OCR_MODEL,
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") } },
        { type: "text", text: OCR_TALIMAT },
      ],
    }],
  });

  const text = yanitMetni(res.content);
  if (!text || text === "OKUNAMADI") {
    return { text: "", kind: "gorsel", ocr: true, warning: `${fileName}: görselde okunabilir metin bulunamadı.` };
  }
  return { text, kind: "gorsel", ocr: true };
}

// Taranmış PDF: metin katmanı yoksa Claude'un PDF belge desteğiyle OCR
async function pdfOcr(buffer: Buffer): Promise<string> {
  const istemci = anthropicIstemci();
  if (!istemci) return "";
  const res = await istemci.messages.create({
    model: OCR_MODEL,
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } },
        { type: "text", text: OCR_TALIMAT },
      ],
    }],
  });
  const text = yanitMetni(res.content);
  return text === "OKUNAMADI" ? "" : text;
}

// PDF: önce metin katmanı (unpdf / pdf.js); yoksa OCR'a düş.
export async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const clean = (text ?? "").replace(/[ \t]+/g, " ").trim();
  if (clean.length >= 40) return { text: clean, kind: "pdf" };

  // Seçilebilir metin yok → taranmış olabilir, OCR dene
  try {
    const ocrText = await pdfOcr(buffer);
    if (ocrText) return { text: ocrText, kind: "pdf", ocr: true };
  } catch (err) {
    console.error("PDF OCR hatası:", err);
  }
  return {
    text: clean,
    kind: "pdf",
    warning:
      "Bu PDF'te seçilebilir metin katmanı yok ve OCR ile de metin çıkarılamadı. " +
      "Belgeyi UDF/Word olarak veya daha net bir taramayla yükleyin.",
  };
}

// DOCX: mammoth ile ham metin
export async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return { text: (result.value ?? "").trim(), kind: "docx" };
}

// DOC (eski ikili Word biçimi): word-extractor
export async function extractDoc(buffer: Buffer): Promise<ExtractResult> {
  const { default: WordExtractor } = await import("word-extractor");
  const doc = await new WordExtractor().extract(buffer);
  const text = [doc.getBody(), doc.getFootnotes(), doc.getEndnotes()]
    .filter((s) => s && s.trim())
    .join("\n")
    .replace(/\r\n?/g, "\n")
    .trim();
  return { text, kind: "doc" };
}

// Uzantı + magic byte'a göre otomatik seçim
export async function extractDocument(fileName: string, buffer: Buffer): Promise<ExtractResult> {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  const isZip = buffer.length > 3 && buffer[0] === 0x50 && buffer[1] === 0x4b; // "PK"
  const isPdf = buffer.length > 4 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
  // OLE2 bileşik belge imzası — eski .doc
  const isOle =
    buffer.length > 8 && buffer.subarray(0, 8).toString("hex") === "d0cf11e0a1b11ae1";

  if (ext in GORSEL_TIPLERI) return extractGorsel(fileName, buffer);

  if (ext === "udf" || (isZip && ext !== "docx")) {
    // UDF ve docx ikisi de ZIP — uzantı docx değilse önce UDF dene, olmadı docx
    try {
      return await extractUdf(buffer);
    } catch {
      if (isZip) return await extractDocx(buffer);
      throw new Error("UDF okunamadı");
    }
  }
  if (ext === "docx") return extractDocx(buffer);
  if (ext === "pdf" || isPdf) return extractPdf(buffer);
  if (ext === "doc" || isOle) return extractDoc(buffer);
  // Düz metin varsayımı
  return { text: buffer.toString("utf8").trim(), kind: "txt" };
}
