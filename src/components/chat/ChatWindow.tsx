"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Scale, StopCircle, ChevronDown } from "lucide-react";
import MessageBubble from "./MessageBubble";
import type { LegalSource } from "@/types";
import type { UserType } from "@/types/database";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: LegalSource[];
  creditCost?: number;
}

interface Props {
  userType: UserType;
  creditBalance?: number;
  sessionId?: string;
  initialMessages?: Message[];
  caseContext?: string;
  placeholder?: string;
  compact?: boolean;
}

const SUGGESTIONS_VATANDAS = [
  "İş akdim haksız feshedildi, ne yapmalıyım?",
  "Kiracım kira ödemiyor, tahliye için ne gerekiyor?",
  "Tüketici mahkemesine nasıl başvururum?",
  "Boşanma davası ne kadar sürer?",
];

const SUGGESTIONS_AVUKAT = [
  "TMK 166/1 kapsamında boşanma şartları nelerdir?",
  "İş mahkemesi kıdem tazminatı hesaplama esasları",
  "Tapu iptali davasında görevli mahkeme",
  "Ticari dava arabuluculuk zorunluluğu",
];

export default function ChatWindow({
  userType,
  creditBalance = 0,
  sessionId: initialSessionId,
  initialMessages = [],
  caseContext,
  placeholder = "Hukuki sorunuzu yazın...",
  compact = false,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [currentBalance, setCurrentBalance] = useState(creditBalance);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userScrolledUp = useRef(false);

  const suggestions = userType === "avukat" ? SUGGESTIONS_AVUKAT : SUGGESTIONS_VATANDAS;

  // Scroll yönetimi: kullanıcı yukarı kaydırdıysa otomatik kaydırmayı durdur
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUp.current = distFromBottom > 80;
    setShowScrollBtn(distFromBottom > 80);
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || !userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      userScrolledUp.current = false;
      setShowScrollBtn(false);
    }
  }, []);

  // Yeni mesaj geldiğinde sadece kullanıcı aşağıdaysa kaydır
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    userScrolledUp.current = false;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, userType, caseContext }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("Content-Type") ?? "";

      if (!res.ok) {
        let errMsg = "Bir hata oluştu. Lütfen tekrar deneyin.";
        if (contentType.includes("application/json")) {
          try {
            const json = await res.json() as { error?: string };
            if (json.error) errMsg = json.error;
          } catch { /* ignore */ }
        }
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: `❌ ${errMsg}` },
        ]);
        return;
      }

      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", sources: [] },
      ]);

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let finalSources: LegalSource[] = [];
      let creditCost: number | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              text?: string;
              sessionId?: string;
              creditCost?: number;
              done?: boolean;
              sources?: LegalSource[];
              error?: string;
            };

            if (data.sessionId) setSessionId(data.sessionId);
            if (data.creditCost !== undefined) {
              creditCost = data.creditCost;
              if (userType === "vatandas") {
                setCurrentBalance((b) => b - data.creditCost!);
              }
            }

            if (data.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + data.text }
                    : m
                )
              );
              // Streaming sırasında aşağıdaysa takip et
              scrollToBottom();
            }

            if (data.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: `❌ ${data.error}` }
                    : m
                )
              );
            }

            if (data.done) {
              finalSources = data.sources ?? [];
            }
          } catch {
            // parse hatası — devam et
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, sources: finalSources, creditCost }
            : m
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // Kullanıcı durdurdu — son mesajı koru
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "❌ Bağlantı hatası. Lütfen tekrar deneyin." },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [loading, sessionId, userType, caseContext, scrollToBottom]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Mesajlar */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-accent" />
            </div>
            <h3 className={`font-heading font-bold text-primary mb-2 ${compact ? "text-base" : "text-xl"}`}>
              Mizanım AI Asistan
            </h3>
            <p className="font-body text-muted-foreground mb-6 max-w-sm text-sm">
              {userType === "vatandas"
                ? "Hukuki sorunuzu sade Türkçe ile sorun, kaynaklı yanıt alın."
                : "Teknik hukuki sorularınızı ve içtihat araştırmalarınızı yapın."}
            </p>
            {!compact && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="text-left bg-card border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground hover:border-accent hover:shadow-gold transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              sources={msg.sources}
              creditCost={msg.creditCost}
              streaming={loading && msg.role === "assistant" && msg === messages[messages.length - 1]}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Aşağı kaydır butonu */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-4 w-9 h-9 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all z-10"
        >
          <ChevronDown className="w-5 h-5 text-accent" />
        </button>
      )}

      {/* Input alanı */}
      <div className="border-t border-border bg-background px-4 py-3">
        {userType === "vatandas" && (
          <div className="flex items-center justify-end mb-2">
            <span className="font-body text-xs text-muted-foreground">
              Bakiye: <strong className="text-accent">{currentBalance} kredi</strong>
            </span>
          </div>
        )}
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={loading}
            className="flex-1 input-field resize-none min-h-[44px] max-h-[120px] py-3 leading-snug disabled:opacity-60"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 120) + "px";
            }}
          />
          {loading ? (
            <button
              onClick={stopStreaming}
              className="w-11 h-11 rounded-xl bg-danger flex items-center justify-center flex-shrink-0 hover:bg-danger/90 transition-all"
              title="Durdur"
            >
              <StopCircle className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5 text-accent" />
            </button>
          )}
        </div>
        <p className="font-body text-xs text-muted-foreground mt-2 text-center">
          Enter ile gönder · Shift+Enter yeni satır
          {loading && (
            <span className="ml-2 inline-flex items-center gap-1 text-accent">
              <Loader2 className="w-3 h-3 animate-spin" />
              Yanıt üretiliyor...
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
