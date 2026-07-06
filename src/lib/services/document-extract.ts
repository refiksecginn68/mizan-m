// Belge metin çıkarma servisi — UDF (UYAP), PDF, DOCX, TXT
// UDF: içinde content.xml bulunan bir ZIP arşividir; metin CDATA içindedir.

import JSZip from "jszip";

export interface ExtractResult {
  text: string;
  kind: "udf" | "pdf" | "docx" | "txt";
  warning?: string;
}

// XML/HTML etiketlerini temizleyip düz metne indirger
function stripXml(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
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

// PDF: metin katmanı (unpdf / pdf.js). Taranmış PDF'te metin çıkmaz → uyarı.
export async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const clean = (text ?? "").replace(/[ \t]+/g, " ").trim();
  if (clean.length < 40) {
    return {
      text: clean,
      kind: "pdf",
      warning:
        "Bu PDF'te seçilebilir metin katmanı yok (taranmış görüntü olabilir). " +
        "Metni okutmak için belgeyi UDF/Word olarak veya OCR uygulanmış PDF olarak yükleyin.",
    };
  }
  return { text: clean, kind: "pdf" };
}

// DOCX: mammoth ile ham metin
export async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return { text: (result.value ?? "").trim(), kind: "docx" };
}

// Uzantı + magic byte'a göre otomatik seçim
export async function extractDocument(fileName: string, buffer: Buffer): Promise<ExtractResult> {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  const isZip = buffer.length > 3 && buffer[0] === 0x50 && buffer[1] === 0x4b; // "PK"
  const isPdf = buffer.length > 4 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";

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
  if (ext === "doc") {
    throw new Error("Eski .doc biçimi desteklenmiyor — belgeyi .docx veya UDF olarak kaydedin");
  }
  // Düz metin varsayımı
  return { text: buffer.toString("utf8").trim(), kind: "txt" };
}
