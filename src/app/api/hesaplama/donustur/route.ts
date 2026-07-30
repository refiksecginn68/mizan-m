import { createClient } from "@/lib/supabase/server";
import { extractDocument } from "@/lib/services/document-extract";
import { duzMetinBloklari } from "@/lib/services/belge-modeli";
import { blokToPdf, blokToDocx, blokToUdf } from "@/lib/services/belge-uret";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// PDF ↔ Word ↔ UDF dönüştürücü — TÜMÜYLE server-side.
// Kaynak formatın metni document-extract ile çıkarılır (PDF'te seçilebilir metin
// yoksa OCR'a düşer), sonra hedef biçim kanıtlı üreticilerle yeniden kurulur.

const IZIN = new Set(["pdf", "docx", "udf"]);
const MAX_BOYUT = 20 * 1024 * 1024; // 20MB

const HEDEF: Record<string, { mime: string; ext: string; uret: (b: Any) => Promise<Uint8Array | Buffer> }> = {
  pdf: { mime: "application/pdf", ext: "pdf", uret: blokToPdf },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx", uret: blokToDocx },
  udf: { mime: "application/octet-stream", ext: "udf", uret: blokToUdf },
};

function uzanti(ad: string): string {
  return ad.toLowerCase().split(".").pop() ?? "";
}

export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Oturum bulunamadı" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single();
    if (!profile || profile.user_type !== "avukat") {
      return Response.json({ error: "Bu araç avukat üyelere açıktır" }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("dosya") as File | null;
    const hedef = String(form.get("hedef") ?? "");

    if (!file) return Response.json({ error: "Dosya yüklenmedi" }, { status: 400 });
    if (!HEDEF[hedef]) return Response.json({ error: "Geçersiz hedef biçim" }, { status: 400 });
    if (file.size > MAX_BOYUT) {
      return Response.json({ error: `Dosya 20MB sınırını aşıyor (${(file.size / 1048576).toFixed(1)}MB)` }, { status: 413 });
    }

    const kaynakUzanti = uzanti(file.name);
    if (!IZIN.has(kaynakUzanti)) {
      return Response.json({ error: `Desteklenmeyen kaynak biçim: .${kaynakUzanti} (pdf/docx/udf)` }, { status: 400 });
    }
    if (kaynakUzanti === hedef) {
      return Response.json({ error: "Kaynak ve hedef biçim aynı" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cikan = await extractDocument(file.name, buffer);

    // Sessizce boş çıktı üretme — taranmış PDF'i OCR akışına yönlendir
    if (!cikan.text || cikan.text.trim().length === 0) {
      return Response.json({
        error: cikan.warning ??
          "Belgeden metin çıkarılamadı. Taranmış/görüntü tabanlı PDF ise Medya & Delil > OCR akışını kullanın.",
        code: "metin_yok",
      }, { status: 422 });
    }

    const bloklar = duzMetinBloklari(cikan.text);
    const h = HEDEF[hedef];
    const ciktiBytes = await h.uret(bloklar);
    const cikti = ciktiBytes instanceof Buffer ? ciktiBytes : Buffer.from(ciktiBytes);

    const adKok = file.name.replace(/\.[^.]+$/, "") || "belge";
    return new Response(new Uint8Array(cikti), {
      status: 200,
      headers: {
        "Content-Type": h.mime,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(adKok)}.${h.ext}"`,
        "Content-Length": String(cikti.length),
        // OCR kullanıldıysa istemci bilgilendirilsin
        "X-Kaynak-Uyari": cikan.ocr ? "ocr" : (cikan.warning ? "uyari" : ""),
      },
    });
  } catch (err) {
    console.error("donustur hatası:", err);
    return Response.json({ error: "Dönüştürme başarısız" }, { status: 500 });
  }
}
