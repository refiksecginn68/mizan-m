import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSystemPrompt, SYSTEM_PROMPT_MEVZUAT_OZET } from "@/lib/ai/prompts";
import { classifyQuery, CREDIT_COSTS } from "@/lib/ai/classify";
import { fetchRAGContext, buildContextString } from "@/lib/ai/rag";
import type { UserType } from "@/types/database";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export async function POST(request: Request) {
  try {
    const supabase = createClient() as AnySupabase;
    const serviceSupabase = createServiceClient() as AnySupabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Oturum açmanız gerekiyor" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json() as {
      message: string;
      sessionId?: string;
      userType?: UserType;
      mode?: string;
      ozet_type?: "mevzuat" | "karar";
      caseContext?: string;
    };

    const { message, sessionId, caseContext } = body;
    // mode, userType, ozet_type aliasları
    const userType: UserType = (body.userType ?? (body.mode === "avukat" ? "avukat" : "vatandas")) as UserType;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Mesaj boş olamaz" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const queryType = classifyQuery(message);
    const cost = CREDIT_COSTS[queryType];

    // Vatandaş kredi kontrolü ve harcama (onaysız — direkt)
    if (userType === "vatandas") {
      const { data: spent } = await serviceSupabase.rpc("spend_credits", {
        p_user_id: user.id,
        p_amount: cost,
        p_description: `AI Soru: ${message.slice(0, 50)}`,
      });

      if (!spent) {
        return new Response(
          JSON.stringify({ error: `Yetersiz kredi. Bu işlem ${cost} kredi gerektirir. Lütfen kredi satın alın.` }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Session oluştur
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: session } = await serviceSupabase
        .from("sessions")
        .insert({ user_id: user.id, title: message.slice(0, 60) })
        .select("id")
        .single();
      activeSessionId = session?.id as string | undefined;
    }

    // Kullanıcı mesajını kaydet
    if (activeSessionId) {
      await serviceSupabase.from("messages").insert({
        session_id: activeSessionId,
        user_id: user.id,
        role: "user",
        content: message,
      });
    }

    // RAG context + avukat adı (ismiyle hitap için)
    const [ragContext, profileResult] = await Promise.all([
      fetchRAGContext(message, queryType),
      userType === "avukat"
        ? serviceSupabase.from("profiles").select("full_name").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);
    const contextStr = buildContextString(ragContext);
    const systemPrompt = body.ozet_type === "mevzuat"
      ? SYSTEM_PROMPT_MEVZUAT_OZET
      : getSystemPrompt(userType, caseContext, profileResult?.data?.full_name ?? undefined);

    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: "user", content: message + contextStr }],
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ sessionId: activeSessionId, creditCost: cost })}\n\n`)
          );

          for await (const chunk of claudeStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          // Asistan yanıtını kaydet
          if (activeSessionId) {
            await serviceSupabase.from("messages").insert({
              session_id: activeSessionId,
              user_id: user.id,
              role: "assistant",
              content: fullResponse,
              sources: ragContext.sources.length > 0 ? ragContext.sources : null,
              credit_cost: userType === "vatandas" ? cost : null,
            });

            await serviceSupabase
              .from("sessions")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", activeSessionId);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, sources: ragContext.sources })}\n\n`
            )
          );
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "AI yanıt üretirken hata oluştu" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
