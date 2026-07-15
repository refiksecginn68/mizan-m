import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { htmlToBloklar, duzMetinBloklari, type Blok } from "@/lib/services/belge-modeli";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// UYAP UDF, ZIP arşivi içinde format_id="1.8" şemalı bir content.xml'dir.
// Metnin tamamı <content> CDATA'sında durur; <elements> altındaki paragraflar
// bu metne startOffset/length ile referans verir. Biçim, content düğümlerinin
// öznitelikleriyle taşınır. (Önceki sürüm ham XML döndürüyordu — UYAP açamıyordu.)

const HIZA_KODU: Record<string, number> = { left: 0, center: 1, right: 2, justify: 3 };

// #rrggbb → Java signed int (UDF foreground bu biçimi bekler)
function javaRenk(hex?: string): number | undefined {
  if (!hex) return undefined;
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return undefined;
  return (0xff000000 | parseInt(m[1], 16)) | 0;
}

function xmlKacis(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function cdataKacis(s: string): string {
  return s.replace(/\]\]>/g, "]]]]><![CDATA[>");
}

function udfUret(bloklar: Blok[], varsayilanFont: string, varsayilanPunto: number): string {
  let govde = "";
  let offset = 0;
  const paragraflar: string[] = [];
  let sayac = 0;

  for (const b of bloklar) {
    if (b.tip !== "numara") sayac = 0;
    const onEk = b.tip === "madde" ? "• " : b.tip === "numara" ? `${++sayac}. ` : "";
    const contentler: string[] = [];

    if (onEk) {
      govde += onEk;
      contentler.push(`<content startOffset="${offset}" length="${onEk.length}" />`);
      offset += onEk.length;
    }

    for (const r of b.runs) {
      if (!r.text) continue;
      govde += r.text;
      const baslikMi = b.tip === "h1" || b.tip === "h2" || b.tip === "h3";
      const punto = r.punto ?? (baslikMi ? varsayilanPunto + 2 : varsayilanPunto);
      const nitelik = [
        `startOffset="${offset}"`,
        `length="${r.text.length}"`,
        `family="${xmlKacis(r.font ?? varsayilanFont)}"`,
        `size="${Math.round(punto)}"`,
        (r.bold || baslikMi) ? 'bold="true"' : "",
        r.italic ? 'italic="true"' : "",
        r.underline ? 'underline="true"' : "",
        r.strike ? 'strikethrough="true"' : "",
        javaRenk(r.color) !== undefined ? `foreground="${javaRenk(r.color)}"` : "",
      ].filter(Boolean).join(" ");
      contentler.push(`<content ${nitelik} />`);
      offset += r.text.length;
    }

    // Her paragraf satır sonuyla biter — offsetler bunu içermeli
    govde += "\n";
    const sonUzunluk = 1;
    if (!contentler.length) {
      contentler.push(`<content startOffset="${offset}" length="${sonUzunluk}" />`);
      offset += sonUzunluk;
    } else {
      const son = contentler.pop()!;
      const m = son.match(/length="(\d+)"/)!;
      contentler.push(son.replace(/length="\d+"/, `length="${Number(m[1]) + sonUzunluk}"`));
      offset += sonUzunluk;
    }

    const hiza = HIZA_KODU[b.hiza ?? "left"] ?? 0;
    const solGirinti = b.girinti ? (b.girinti * 0.75).toFixed(1) : "0.0";
    paragraflar.push(
      `<paragraph Alignment="${hiza}" LeftIndent="${solGirinti}" RightIndent="0.0">${contentler.join("")}</paragraph>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8" ?>
<template format_id="1.8">
<content><![CDATA[${cdataKacis(govde)}]]></content>
<properties><pageFormat mediaSizeName="1" leftMargin="70.875" rightMargin="70.875" topMargin="70.875" bottomMargin="70.875" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>
<elements resolver="hvl-default">
${paragraflar.join("\n")}
</elements>
<styles>
<style name="default" description="Geçerli" family="Dialog" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="Dialog" />
<style name="hvl-default" family="${xmlKacis(varsayilanFont)}" size="${varsayilanPunto}" description="Gövde" />
</styles>
</template>`;
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

    let bloklar: Blok[] = html ? htmlToBloklar(html) : duzMetinBloklari(metin ?? "");
    if (!bloklar.length) return Response.json({ error: "Belge içeriği çözümlenemedi" }, { status: 400 });

    const temizBaslik = (baslik ?? "").trim().split("\n")[0].slice(0, 120);
    if (temizBaslik && !bloklar[0]?.tip.startsWith("h")) {
      bloklar = [{ tip: "h1", runs: [{ text: temizBaslik, bold: true }], hiza: "center" }, ...bloklar];
    }

    const contentXml = udfUret(bloklar, "Times New Roman", 12);

    const zip = new JSZip();
    zip.file("content.xml", contentXml);
    const udf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    return new Response(new Uint8Array(udf), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="dilekce.udf"',
        "Content-Length": String(udf.length),
      },
    });
  } catch (err) {
    console.error("export-udf hatası:", err);
    return Response.json({ error: "UDF belgesi oluşturulamadı" }, { status: 500 });
  }
}
