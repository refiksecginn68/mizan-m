import { htmlToText } from "@/lib/services/bedesten";
import { tekKararMetni } from "@/lib/services/emsal-doc-cache";

const UYAP_BASE = "https://emsal.uyap.gov.tr";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return Response.json({ error: "ID gerekli" }, { status: 400 });

  // 1) Kalıcı önbellek → Bedesten getDocumentContent (birincil — base64 HTML)
  // essential=true: karar açma kullanıcı eylemi, 429 soğumasında bile denenir
  try {
    const content = await tekKararMetni(id, true);
    if (content) {
      return Response.json({
        content,
        source_url: `https://mevzuat.adalet.gov.tr/ictihat/${id}`,
        source: "live",
      });
    }
  } catch { /* fallback'e geç */ }

  // 2) UYAP emsal getDokuman fallback (eski ID'ler için)
  try {
    const res = await fetch(`${UYAP_BASE}/getDokuman?id=${encodeURIComponent(id)}`, {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Accept: "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json() as { data?: string; metadata?: { FMTY?: string } };
      if (data.data && data.metadata?.FMTY === "SUCCESS") {
        return Response.json({
          content: htmlToText(data.data),
          source_url: `https://mevzuat.adalet.gov.tr/ictihat/${id}`,
          source: "live",
        });
      }
    }
  } catch { /* ignore */ }

  return Response.json({ content: null, source: "unavailable" });
}
