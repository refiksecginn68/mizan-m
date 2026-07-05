"use client";

import { useState, useRef, useCallback } from "react";
import { MessageSquare, X, Send, StopCircle, Scale, Loader2 } from "lucide-react";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  caseId: string;
  caseTitle: string;
  caseContext: string; // dava no, taraflar, mahkeme, belgeler özeti
}

export default function DavaAsistanPanel({ caseTitle, caseContext }: Props) {
  const [open, setOpen] = useState(false);
  // true → bu dava bağlamında; false → genel asistan
  const [davaModu, setDavaModu] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  const followBottom = useCallback((force = false) => {
    const el = scrollRef.current;
    if (!el) return;
    if (force || pinnedToBottom.current) el.scrollTop = el.scrollHeight;
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: Date.now().toString(), role: "user", content: text }]);
    setLoading(true);
    pinnedToBottom.current = true;
    requestAnimationFrame(() => followBottom(true));

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const assistantId = (Date.now() + 1).toString();
    setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userType: "avukat",
          caseContext: davaModu ? caseContext : undefined,
        }),
        signal: ctrl.signal,
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6)) as { text?: string; delta?: string; error?: string };
            const delta = json.text ?? json.delta ?? "";
            if (delta) {
              setMessages((m) => m.map((msg) => msg.id === assistantId ? { ...msg, content: msg.content + delta } : msg));
              requestAnimationFrame(() => followBottom());
            }
            if (json.error) {
              setMessages((m) => m.map((msg) => msg.id === assistantId ? { ...msg, content: `❌ ${json.error}` } : msg));
            }
          } catch { /* ignore */ }
        }
      }
    } catch { /* aborted */ }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full text-center bg-accent text-primary font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
      >
        Asistanı Aç
      </button>

      {/* Yan bar — sayfa üzerinde sağdan açılır */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
          {/* Başlık */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0f1729] flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center flex-shrink-0">
              <Scale className="w-4 h-4 text-[#c9a84c]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm font-bold text-white leading-tight">Dosya Asistanı</p>
              <p className="font-body text-xs text-white/50 truncate">{davaModu ? caseTitle : "Genel asistan"}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bağlam toggle */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 flex-shrink-0 bg-gray-50">
            <button
              onClick={() => setDavaModu(true)}
              className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                davaModu ? "bg-[#0f1729] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Bu Dava Bağlamında
            </button>
            <button
              onClick={() => setDavaModu(false)}
              className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                !davaModu ? "bg-[#0f1729] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Genel Asistan
            </button>
          </div>

          {/* Mesajlar */}
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {davaModu
                    ? "Bu dava dosyası hakkında soru sorun — taraflar, belgeler ve dava bilgileri asistana açık."
                    : "Genel hukuki soru sorun."}
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#0f1729] text-white rounded-br-sm whitespace-pre-wrap"
                    : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {msg.role === "assistant" ? (
                    msg.content ? <MarkdownRenderer content={msg.content} /> : (
                      loading ? (
                        <span className="flex gap-1 items-center py-0.5">
                          <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      ) : null
                    )
                  ) : msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={davaModu ? "Bu dava hakkında sorun..." : "Hukuki soru sorun..."}
              rows={1}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#c9a84c]/60 resize-none max-h-28"
            />
            {loading ? (
              <button
                onClick={() => { abortRef.current?.abort(); setLoading(false); }}
                className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-[#c9a84c] flex items-center justify-center text-white hover:bg-[#e7b743] disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
