import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export type AiSurface =
  | "chat"
  | "mizanai"
  | "dilekce"
  | "dilekce_sorular"
  | "medya"
  | "transcribe"
  | "embed"
  | "rerank";

export type AiProvider = "anthropic" | "cohere" | "fal";

interface UsageInput {
  surface: AiSurface;
  provider: AiProvider;
  model: string;
  userId?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  /** Token bazlı fiyatlandırması olmayan sağlayıcılar (Cohere/fal.ai) için tahmini maliyet */
  flatCostUsd?: number;
}

// $/1M token (giriş, çıkış) — Anthropic resmi liste fiyatı. Fiyat değişirse güncellenmeli.
const ANTHROPIC_PRICES: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-haiku-4-5-20251001": { in: 1, out: 5 },
};

// Cohere embed/rerank API'si token/karakter bazlı kullanım döndürmez — resmi "istek
// başı" liste fiyatından çıkarılan sabit tahminlerdir, gerçek faturadan sapabilir.
export const COHERE_EMBED_COST_USD = 0.0001;
export const COHERE_RERANK_COST_USD = 0.002;
// fal.ai Whisper dakika bazlı ücretlendirir; ortalama kayıt süresine göre sabit tahmin.
export const FAL_WHISPER_COST_USD = 0.01;

function usdTry(): number {
  return Number(process.env.USD_TRY) || 42;
}

function anthropicCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = ANTHROPIC_PRICES[model] ?? ANTHROPIC_PRICES["claude-sonnet-4-6"];
  return (inputTokens / 1_000_000) * price.in + (outputTokens / 1_000_000) * price.out;
}

// Fire-and-forget: hata olsa da ana AI akışını bozmaz/yavaşlatmaz (içeride yutulur).
export async function logAiUsage(input: UsageInput): Promise<void> {
  try {
    const costUsd =
      input.flatCostUsd ?? anthropicCostUsd(input.model, input.inputTokens ?? 0, input.outputTokens ?? 0);
    const svc = createServiceClient() as Any;
    await svc.from("ai_usage_log").insert({
      user_id: input.userId ?? null,
      surface: input.surface,
      provider: input.provider,
      model: input.model,
      input_tokens: input.inputTokens ?? 0,
      output_tokens: input.outputTokens ?? 0,
      cost_usd: costUsd,
      cost_try: costUsd * usdTry(),
    });
  } catch (e) {
    console.error("[ai-usage-log] yazılamadı:", e);
  }
}
