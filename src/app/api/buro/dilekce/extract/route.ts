import { createClient } from "@/lib/supabase/server";
import { extractDocument } from "@/lib/services/document-extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_TEXT_CHARS = 60_000;

// Yüklenen UDF/PDF/DOCX/TXT belgesinden düz metin çıkarır
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Oturum gerekli" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Dosya gerekli" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "Dosya 15 MB'den büyük olamaz" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractDocument(file.name, buffer);

    const truncated = result.text.length > MAX_TEXT_CHARS;
    return Response.json({
      text: truncated ? result.text.slice(0, MAX_TEXT_CHARS) : result.text,
      kind: result.kind,
      chars: result.text.length,
      truncated,
      warning: result.warning,
    });
  } catch (err) {
    console.error("Belge metin çıkarma hatası:", err);
    const msg = err instanceof Error ? err.message : "Belge okunamadı";
    return Response.json({ error: msg }, { status: 422 });
  }
}
