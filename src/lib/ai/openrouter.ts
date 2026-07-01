import { createOpenAI } from "@ai-sdk/openai";

// OpenRouter üzerinden GLM modelleri
// Kullanılabilir GLM modeller (z-ai provider):
//   z-ai/glm-5.2      → en güncel, genel amaç (önerilen)
//   z-ai/glm-5        → stabil GLM-5
//   z-ai/glm-5-turbo  → hızlı & ucuz
//   z-ai/glm-4.5      → önceki nesil, ucuz

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://mizanim.com",
    "X-Title": "Mizanım",
  },
});

export const glm52 = openrouter("z-ai/glm-5.2");
export const glm5 = openrouter("z-ai/glm-5");
export const glm5Turbo = openrouter("z-ai/glm-5-turbo");
