import { createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embed";

export async function POST(request: Request) {
  // n8n webhook güvenlik kontrolü
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Yetkisiz" }), { status: 401 });
  }

  const body = await request.json() as {
    type: "legislation" | "case_law";
    id: string;
    content: string;
    title: string;
    article_number?: string;
    court?: string;
    case_number?: string;
  };

  const cohereKey = process.env.COHERE_API_KEY;
  if (!cohereKey) {
    return new Response(JSON.stringify({ error: "Cohere API key eksik" }), { status: 400 });
  }

  const supabase = createServiceClient();
  const text = body.type === "legislation"
    ? `${body.title} Madde ${body.article_number ?? ""}: ${body.content}`
    : `${body.court ?? ""} ${body.case_number ?? ""}: ${body.title} - ${body.content}`;

  const embedding = await generateEmbedding(text, "document");
  if (!embedding) {
    return new Response(JSON.stringify({ error: "Embedding üretilemedi" }), { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("law_embeddings") as any).upsert({
    source_type: body.type === "legislation" ? "kanun" : "karar",
    source_id: body.id,
    content_chunk: text.slice(0, 1000),
    embedding,
    metadata: {
      title: body.title,
      article_number: body.article_number ?? "",
      court: body.court ?? "",
      case_number: body.case_number ?? "",
    },
  }, { onConflict: "source_type,source_id" });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
