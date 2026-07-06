import {
  getMevzuatText,
  getMevzuatMaddeTree,
  getMevzuatMaddeText,
  findMaddeByNo,
} from "@/lib/services/bedesten";

// Mevzuat tam metni (veya belirli bir madde) — Bedesten getDocumentContent
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  const madde = searchParams.get("madde")?.trim();

  if (!id) return Response.json({ error: "id gerekli" }, { status: 400 });

  try {
    // Belirli madde istendiyse madde ağacından bul
    if (madde && /^\d+$/.test(madde)) {
      const tree = await getMevzuatMaddeTree(id);
      if (tree) {
        const node = findMaddeByNo(tree, parseInt(madde, 10));
        if (node?.maddeId) {
          const content = await getMevzuatMaddeText(node.maddeId);
          if (content) {
            return Response.json({
              content: `${node.maddeBaslik ?? `Madde ${madde}`}\n\n${content}`,
              madde: parseInt(madde, 10),
              source: "live",
            });
          }
        }
      }
      return Response.json({ content: null, error: "Madde bulunamadı" }, { status: 404 });
    }

    // Tam metin (büyük kanunlarda ~500KB olabilir; 400k karakterle sınırla)
    const content = await getMevzuatText(id);
    if (content) {
      const truncated = content.length > 400_000;
      return Response.json({
        content: truncated ? content.slice(0, 400_000) + "\n\n… (metin kısaltıldı)" : content,
        truncated,
        source: "live",
      });
    }
    return Response.json({ content: null, source: "unavailable" }, { status: 404 });
  } catch (err) {
    console.error("Mevzuat metin error:", err);
    return Response.json({ content: null, source: "error" }, { status: 500 });
  }
}
