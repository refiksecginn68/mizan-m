import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Rapor metnini basit PDF'e çevirir (documents bucket'ı text/plain kabul etmiyor)
async function reportToPdf(title: string, text: string): Promise<Buffer> {
  const W = 595, H = 842, M = 70, LH = 16, FS = 10;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf"));
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const maxChars = Math.floor((W - M * 2) / (FS * 0.55));

  let page = pdf.addPage([W, H]);
  let y = H - M;
  page.drawText(title.slice(0, 70), { x: M, y, size: 13, font, color: rgb(0.06, 0.09, 0.16) });
  y -= LH * 2;

  const wrap = (line: string): string[] => {
    if (line.length <= maxChars) return [line];
    const out: string[] = [];
    let cur = "";
    for (const w of line.split(" ")) {
      if ((cur + " " + w).trim().length <= maxChars) cur = (cur + " " + w).trim();
      else { if (cur) out.push(cur); cur = w; }
    }
    if (cur) out.push(cur);
    return out;
  };

  for (const raw of text.split("\n")) {
    if (!raw.trim()) { y -= LH * 0.5; continue; }
    for (const wl of wrap(raw)) {
      if (y < M + LH) { page = pdf.addPage([W, H]); y = H - M; }
      page.drawText(wl, { x: M, y, size: FS, font, color: rgb(0.1, 0.1, 0.1) });
      y -= LH;
    }
  }
  return Buffer.from(await pdf.save());
}

// Delil analiz raporunu mahkeme dosyasına (case_documents) kaydeder.
// Rapor .txt olarak Storage'a yüklenir + case_documents satırı eklenir;
// dava detayındaki belge listesinde görünür.
export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const body = await request.json().catch(() => null) as {
      caseId?: string;
      fileName?: string;
      analysisType?: string;
      reportText?: string;
    } | null;

    if (!body?.caseId || !body?.reportText?.trim()) {
      return Response.json({ error: "Dava ve rapor metni zorunludur" }, { status: 400 });
    }

    const svc = createServiceClient() as Any;

    // Dava bu avukata mı ait?
    const { data: caseRow } = await svc
      .from("cases").select("id, title").eq("id", body.caseId).eq("lawyer_id", user.id).single();
    if (!caseRow) return Response.json({ error: "Dava bulunamadı" }, { status: 404 });

    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const report = `MİZANIM DELİL ANALİZ RAPORU
============================
Kaynak dosya : ${body.fileName ?? "-"}
Analiz türü  : ${body.analysisType ?? "-"}
Tarih        : ${stamp}
Dava         : ${caseRow.title}

${body.reportText.trim()}

---
⚠️ Bu analiz AI destekli ön değerlendirmedir; hukuki tavsiye niteliği taşımaz.
`;

    const docName = `Delil Analizi — ${(body.fileName ?? "rapor").replace(/\.[a-z0-9]+$/i, "")}.pdf`;
    const storagePath = `case/${user.id}/${body.caseId}/${Date.now()}-analiz.pdf`;
    const pdfBuffer = await reportToPdf(docName.replace(/\.pdf$/, ""), report);

    const { error: storageError } = await svc.storage
      .from("documents")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (storageError) {
      console.error("Analiz storage error:", storageError.message);
      return Response.json({ error: "Rapor depolamaya yüklenemedi" }, { status: 500 });
    }

    const { data: doc, error: dbError } = await svc
      .from("case_documents")
      .insert({
        case_id: body.caseId,
        lawyer_id: user.id,
        name: docName,
        storage_path: storagePath,
        file_type: "pdf",
        file_size: pdfBuffer.length,
      })
      .select("id, name, created_at")
      .single();

    if (dbError) {
      console.error("Analiz case_documents error:", dbError);
      return Response.json({ error: "Rapor dosyaya kaydedilemedi" }, { status: 500 });
    }

    return Response.json({ success: true, document: doc });
  } catch (err) {
    console.error("Analiz kaydetme hatası:", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
