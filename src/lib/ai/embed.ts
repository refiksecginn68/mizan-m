export const EMBEDDING_DIMENSIONS = 1024;

export async function generateEmbedding(
  text: string,
  type: "query" | "document" = "document"
): Promise<number[] | null> {
  const cohereKey = process.env.COHERE_API_KEY;
  if (!cohereKey) return null;

  try {
    const response = await fetch("https://api.cohere.com/v1/embed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cohereKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "embed-multilingual-v3.0",
        texts: [text.slice(0, 4000)],
        input_type: type === "query" ? "search_query" : "search_document",
        embedding_types: ["float"],
      }),
    });

    if (!response.ok) {
      console.error("Cohere embedding error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json() as { embeddings: { float: number[][] } };
    return data.embeddings.float[0] || null;
  } catch (err) {
    console.error("Cohere embedding exception:", err);
    return null;
  }
}

export async function generateEmbeddingBatch(
  texts: string[],
  type: "query" | "document" = "document"
): Promise<(number[] | null)[]> {
  const cohereKey = process.env.COHERE_API_KEY;
  if (!cohereKey) return texts.map(() => null);

  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += 96) {
    batches.push(texts.slice(i, i + 96));
  }

  const results: (number[] | null)[] = [];
  for (const batch of batches) {
    try {
      const response = await fetch("https://api.cohere.com/v1/embed", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cohereKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "embed-multilingual-v3.0",
          texts: batch.map((t) => t.slice(0, 4000)),
          input_type: type === "query" ? "search_query" : "search_document",
          embedding_types: ["float"],
        }),
      });

      if (!response.ok) {
        console.error("Cohere batch embedding error:", response.status, response.statusText);
        results.push(...batch.map(() => null));
        continue;
      }

      const data = await response.json() as { embeddings: { float: number[][] } };
      results.push(...data.embeddings.float);
    } catch (err) {
      console.error("Cohere batch embedding exception:", err);
      results.push(...batch.map(() => null));
    }
  }

  return results;
}

