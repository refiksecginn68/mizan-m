const UYAP_BASE = "https://emsal.uyap.gov.tr";

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return Response.json({ error: "ID gerekli" }, { status: 400 });

  try {
    const res = await fetch(`${UYAP_BASE}/getDokuman?id=${encodeURIComponent(id)}`, {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Accept": "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(15000),
      // UYAP uses self-signed cert sometimes — we're server-side so no verify needed
    });

    if (!res.ok) {
      return Response.json({ content: null, source: "unavailable", status: res.status });
    }

    const data = await res.json() as { data?: string; metadata?: { FMTY?: string } };

    if (!data.data || data.metadata?.FMTY !== "SUCCESS") {
      return Response.json({ content: null, source: "empty" });
    }

    const content = htmlToText(data.data);
    const source_url = `https://mevzuat.adalet.gov.tr/ictihat/${id}`;

    return Response.json({ content, source_url, source: "live" });
  } catch (err) {
    console.error("UYAP getDokuman error:", err instanceof Error ? err.message : err);
    return Response.json({ content: null, source: "unavailable" });
  }
}
