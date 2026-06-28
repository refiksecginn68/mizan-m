"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Scale, StopCircle, ChevronDown, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  lawyerName: string;
}

const QUICK_ACTIONS = [
  "Yarın duruşmam var mı?",
  "Bu hafta takvimim nedir?",
  "Bekleyen ödemelerim var mı?",
  "En son eklenen müvekkil kim?",
];

export default function AvukatAIPanel({ lawyerName }: Props) {
  const firstName = lawyerName.split(" ")[0];

  const greeting: Message = {
    id: "greeting",
    role: "assistant",
    content: `Sayın Av. ${firstName} Bey, bugün size nasıl yardımcı olabilirim?\n\nTakvim, davalar, müvekkiller veya ödemeler hakkında soru sorabilir, dilekçe hazırlatabilir ya da emsal karar araştırması yaptırabilirsiniz.`,
  };

  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [context, setContext] = useState<string>("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userScrolledUp = useRef(false);

  // Avukat bağlamını yükle
  useEffect(() => {
    fetch("/api/buro/context")
      .then((r) => r.json())
      .then((d: { context?: string }) => { if (d.context) setContext(d.context); })
      .catch(() => {});
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUp.current = dist > 80;
    setShowScrollBtn(dist > 80);
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || !userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      userScrolledUp.current = false;
      setShowScrollBtn(false);
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInput("");
    setLoading(true);
    userScrolledUp.current = false;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          userType: "avukat",
          caseContext: context || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `❌ ${json.error ?? "Bir hata oluştu."}` }]);
        return;
      }

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as { text?: string; sessionId?: string; done?: boolean; error?: string };
            if (data.sessionId) setSessionId(data.sessionId);
            if (data.text) {
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + data.text } : m));
              scrollToBottom();
            }
            if (data.error) {
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: `❌ ${data.error}` } : m));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "❌ Bağlantı hatası." }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [loading, sessionId, context, scrollToBottom]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  return (
    <aside className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-l border-border bg-background">
      {/* Başlık */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
          <Scale className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-sm font-bold text-white leading-tight">AI Asistan</p>
          <p className="font-body text-xs text-white/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Sistem verisine erişimli
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-accent/60 flex-shrink-0" />
      </div>

      {/* Mesajlar */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4 relative"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Scale className="w-3 h-3 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 font-body text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {msg.content}
              {loading && msg.role === "assistant" && msg === messages[messages.length - 1] && msg.content === "" && (
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-4 w-8 h-8 rounded-full bg-primary shadow-lg flex items-center justify-center z-10"
        >
          <ChevronDown className="w-4 h-4 text-accent" />
        </button>
      )}

      {/* Hızlı aksiyonlar — sadece karşılama mesajındayken */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 grid grid-cols-1 gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              className="text-left px-3 py-2 rounded-lg border border-border text-xs font-body text-muted-foreground hover:border-accent hover:text-foreground hover:bg-accent/5 transition-all"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-3 py-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Soru sorun veya görev verin..."
            rows={1}
            disabled={loading}
            className="flex-1 input-field resize-none text-sm min-h-[40px] max-h-[100px] py-2.5 leading-snug disabled:opacity-60"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 100) + "px";
            }}
          />
          {loading ? (
            <button
              onClick={() => { abortRef.current?.abort(); setLoading(false); }}
              className="w-10 h-10 rounded-xl bg-danger flex items-center justify-center flex-shrink-0"
              title="Durdur"
            >
              <StopCircle className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 text-accent animate-spin" /> : <Send className="w-4 h-4 text-accent" />}
            </button>
          )}
        </div>
        <p className="font-body text-xs text-muted-foreground mt-1.5 text-center">
          Enter ile gönder · Shift+Enter yeni satır
        </p>
      </div>
    </aside>
  );
}
