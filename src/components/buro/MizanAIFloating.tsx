"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { X, Send, StopCircle } from "lucide-react";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  lawyerName: string;
}

export default function MizanAIFloating({ lawyerName }: Props) {
  const firstName = lawyerName.split(" ")[0];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "assistant",
      content: `Merhaba Av. ${firstName}! Size nasıl yardımcı olabilirim?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Scroll-anchor: kullanıcı en alttaysa takip et, yukarı kaydırdıysa dokunma
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
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    pinnedToBottom.current = true;
    requestAnimationFrame(() => followBottom(true));

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const assistantId = (Date.now() + 1).toString();
    setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/buro/mizanai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
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
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.delta ?? "";
              if (delta) {
                setMessages((m) =>
                  m.map((msg) =>
                    msg.id === assistantId ? { ...msg, content: msg.content + delta } : msg
                  )
                );
                requestAnimationFrame(() => followBottom());
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch { /* aborted */ }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e7b743] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform overflow-hidden ${open ? "hidden" : ""}`}
        title="MizanAI"
      >
        <Image src="/logo.png" alt="MizanAI" width={40} height={40} className="w-10 h-10 object-cover rounded-full" />
      </button>

      {/* Chat panel — yumuşak slide-in/out (yalnızca transform+opacity anime edilir) */}
      <div
        aria-hidden={!open}
        className={`fixed bottom-6 right-6 z-50 w-80 h-[480px] bg-[#0f1729] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden origin-bottom-right transition-[transform,opacity] duration-[250ms] ease-out ${
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#c9a84c]/20 to-transparent flex-shrink-0">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
              <Image src="/logo.png" alt="MizanAI" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">MizanAI</p>
              <p className="text-[10px] text-white/40">Hukuk Asistanı</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#c9a84c] text-white"
                      : "bg-[#1a2d4f] text-white"
                  }`}
                >
                  {msg.role === "assistant" && msg.content ? (
                    <MarkdownRenderer content={msg.content} invert />
                  ) : msg.content || (loading && msg.role === "assistant" ? (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-white/10 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Soru sorun..."
              className="flex-1 bg-white border border-white/20 rounded-xl px-3 py-2 text-xs text-[#1a2744] placeholder:text-[#6b7280] focus:outline-none focus:border-[#c9a84c]/70"
            />
            {loading ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-xl bg-[#c9a84c] flex items-center justify-center text-white hover:bg-[#e7b743] transition-colors disabled:opacity-40 flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
      </div>
    </>
  );
}
