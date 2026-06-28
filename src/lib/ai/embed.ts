export const EMBEDDING_DIMENSIONS = 1536;

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null; // OpenAI key yoksa full-text fallback kullanılır

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    console.error("Embedding hatası:", response.statusText);
    return null;
  }

  const data = await response.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

export async function generateEmbeddingBatch(
  texts: string[]
): Promise<(number[] | null)[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return texts.map(() => null);

  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    batches.push(texts.slice(i, i + 100));
  }

  const results: (number[] | null)[] = [];
  for (const batch of batches) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: batch.map((t) => t.slice(0, 8000)),
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      results.push(...batch.map(() => null));
      continue;
    }

    const data = await response.json() as { data: { embedding: number[]; index: number }[] };
    const sorted = data.data.sort((a, b) => a.index - b.index);
    results.push(...sorted.map((d) => d.embedding));
  }

  return results;
}
