import { createClient } from "@/lib/supabase/server";
import { htmlToBloklar, duzMetinBloklari, type Blok } from "@/lib/services/belge-modeli";
import { blokToPdf } from "@/lib/services/belge-uret";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// PDF üretimi src/lib/services/belge-uret.ts'te (tek kaynak — Dönüştürücü ile ortak).
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

    const pdfBytes = await blokToPdf(bloklar);

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
