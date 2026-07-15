import { createClient } from "@/lib/supabase/server";
import { extractDocument } from "@/lib/services/document-extract";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_DOSYA = 20;
const MAX_TEXT_CHARS = 60_000;    // tek dosya
const MAX_TOPLAM_CHARS = 200_000; // tüm dosyalar
const ES_ZAMANLI = 4; // OCR çağrıları pahalı — aynı anda en fazla 4 dosya

export interface DosyaSonucu {
  ad: string;
  ok: boolean;
  text: string;
  kind?: string;
  chars?: number;
  truncated?: boolean;
  ocr?: boolean;
  warning?: string;
  error?: string;
}

async function tekDosya(file: File): Promise<DosyaSonucu> {
  if (file.size > MAX_FILE_SIZE) {
    return { ad: file.name, ok: false, text: "", error: "Dosya 15 MB'den büyük olamaz" };
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const r = await extractDocument(file.name, buffer);
    const truncated = r.text.length > MAX_TEXT_CHARS;
    return {
      ad: file.name,
      ok: true,
      text: truncated ? r.text.slice(0, MAX_TEXT_CHARS) : r.text,
      kind: r.kind,
      chars: r.text.length,
      truncated,
      ocr: r.ocr,
      warning: r.warning,
    };
  } catch (err) {
    return {
      ad: file.name,
      ok: false,
      text: "",
      error: err instanceof Error ? err.message : "Belge okunamadı",
    };
  }
}

// Sırayı koruyarak sınırlı eş zamanlılıkla işler
async function havuzda<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

// Yüklenen UDF/PDF/DOCX/DOC/görsel/TXT belgelerinden düz metin çıkarır (en fazla 20 dosya)
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Oturum gerekli" }, { status: 401 });

    const form = await request.formData();
    // Çoklu alan adı "files"; tekli "file" geriye dönük uyumluluk için korunur
    const files = [...form.getAll("files"), ...form.getAll("file")]
      .filter((f): f is File => f instanceof File);

    if (!files.length) return Response.json({ error: "Dosya gerekli" }, { status: 400 });
    if (files.length > MAX_DOSYA) {
      return Response.json({ error: `En fazla ${MAX_DOSYA} dosya yükleyebilirsiniz` }, { status: 400 });
    }

    const sonuclar = await havuzda(files, ES_ZAMANLI, tekDosya);

    // Dosya adlarıyla etiketlenmiş birleşik metin — AI hangi bilginin nereden geldiğini bilsin
    let toplam = "";
    for (const s of sonuclar) {
      if (!s.ok || !s.text) continue;
      const parca = `\n\n===== BELGE: ${s.ad} =====\n${s.text}`;
      if (toplam.length + parca.length > MAX_TOPLAM_CHARS) {
        toplam += parca.slice(0, Math.max(0, MAX_TOPLAM_CHARS - toplam.length));
        break;
      }
      toplam += parca;
    }

    return Response.json({
      files: sonuclar,
      text: toplam.trim(),
      okunan: sonuclar.filter((s) => s.ok && s.text).length,
      toplam: sonuclar.length,
    });
  } catch (err) {
    console.error("Belge metin çıkarma hatası:", err);
    const msg = err instanceof Error ? err.message : "Belge okunamadı";
    return Response.json({ error: msg }, { status: 422 });
  }
}
