import { createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embed";
import type { LegalSource } from "@/types";

export interface RAGContext {
  chunks: string[];
  sources: LegalSource[];
}

interface LegislationRow {
  id: string;
  title: string;
  article_number: string | null;
  content: string;
}

interface CaseLawRow {
  id: string;
  court: string;
  case_number: string;
  decision_number: string | null;
  decision_date: string | null;
  subject: string;
  summary: string;
}

interface EmbeddingSearchRow {
  source_type: string;
  source_id: string;
  content_chunk: string;
  similarity: number;
  metadata: Record<string, string> | null;
}

export async function fetchRAGContext(
  query: string,
  queryType: string
): Promise<RAGContext> {
  const supabase = createServiceClient();
  const chunks: string[] = [];
  const sources: LegalSource[] = [];

  try {
    // 1. Vektör arama (OpenAI key varsa)
    const embedding = await generateEmbedding(query);

    if (embedding) {
      const threshold = queryType === "emsal_arastirma" ? 0.72 : 0.75;
      const limit = queryType === "emsal_arastirma" ? 8 : 5;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: vectorResults } = await (supabase as any).rpc("semantic_search", {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
      }) as { data: EmbeddingSearchRow[] | null };

      vectorResults?.forEach((r) => {
        chunks.push(
          `[${r.source_type.toUpperCase()}] ${r.metadata?.title ?? ""}\n${r.content_chunk}`
        );
        sources.push({
          type: r.source_type as "kanun" | "karar" | "anayasa",
          title: r.metadata?.title ?? r.content_chunk.slice(0, 60),
          article: r.metadata?.article_number,
          case_number: r.metadata?.case_number,
          date: r.metadata?.decision_date,
          court: r.metadata?.court,
        });
      });

      if (chunks.length > 0) return { chunks, sources };
    }
  } catch {
    // vektör arama başarısız → full-text'e düş
  }

  // 2. Full-text fallback (Türkçe)
  const searchTerms = query
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6)
    .join(" | ");

  if (!searchTerms) return { chunks: [], sources: [] };

  const [{ data: legislation }, { data: caseLaws }] = await Promise.all([
    supabase
      .from("legislation")
      .select("id, title, article_number, content")
      .textSearch("content", searchTerms, { type: "websearch", config: "turkish" })
      .eq("is_current", true)
      .limit(3) as unknown as Promise<{ data: LegislationRow[] | null }>,

    supabase
      .from("case_laws")
      .select("id, court, case_number, decision_number, decision_date, subject, summary")
      .textSearch("summary", searchTerms, { type: "websearch", config: "turkish" })
      .limit(queryType === "emsal_arastirma" ? 5 : 2) as unknown as Promise<{ data: CaseLawRow[] | null }>,
  ]);

  legislation?.forEach((leg) => {
    chunks.push(
      `[MEVZUAT] ${leg.title}${leg.article_number ? ` Madde ${leg.article_number}` : ""}:\n${leg.content.slice(0, 500)}`
    );
    sources.push({ type: "kanun", title: leg.title, article: leg.article_number ?? undefined });
  });

  caseLaws?.forEach((cl) => {
    const dateStr = cl.decision_date
      ? new Date(cl.decision_date).toLocaleDateString("tr-TR")
      : "";
    chunks.push(
      `[EMSAL] ${cl.court} - ${cl.case_number}${cl.decision_number ? ` K.${cl.decision_number}` : ""} (${dateStr}):\n${cl.summary.slice(0, 400)}`
    );
    sources.push({
      type: "karar",
      title: cl.subject,
      case_number: `${cl.case_number}${cl.decision_number ? ` K.${cl.decision_number}` : ""}`,
      date: dateStr,
      court: cl.court,
    });
  });

  return { chunks, sources };
}

export function buildContextString(ragContext: RAGContext): string {
  if (ragContext.chunks.length === 0) return "";
  return `\n\n## İLGİLİ HUKUKİ KAYNAKLAR\n${ragContext.chunks.join("\n\n")}`;
}
