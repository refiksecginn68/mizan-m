"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Send, Plus, Trash2, StopCircle,
  Loader2, Calendar, Users, FileText,
  CheckCircle, Clock, ChevronRight, MessageSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Action {
  type: "takvim" | "muvekkil_ara" | "dilekce_baslat";
  data: Record<string, string>;
}

interface Props {
  lawyerName: string;
}

const QUICK_ACTIONS = [
  { label: "Yarın duruşmam var mı?", icon: Calendar },
  { label: "Bu haftaki takvimim", icon: Clock },
  { label: "Aktif davalarım", icon: FileText },
  { label: "Müvekkil listesi", icon: Users },
  { label: "Bu ay tahsilatım ne kadar?", icon: ChevronRight },
  { label: "Kıdem tazminatı zamanaşımı", icon: ChevronRight },
];

// Aksiyonları yanıt metninden gizle
function cleanResponse(text: string): string {
  return text.replace(/```action:\w+\n[\s\S]*?```/g, "").trim();
}

export default function MizanAIBeyin({ lawyerName }: Props) {
  const router = useRouter();
  const firstName = lawyerName.split(" ")[0];

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [completedActions, setCompletedActions] = useState<Action[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/buro/mizanai/sessions");
      const data = await res.json() as { sessions: Session[] };
      setSessions(data.sessions ?? []);
    } catch { /* ignore */ }
    setSessionsLoading(false);
  }

  async function loadSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setMessages([]);
    try {
      const res = await fetch(`/api/buro/mizanai/messages?sessionId=${sessionId}`);
      const data = await res.json() as { messages: Array<{ id: string; role: "user" | "assistant"; content: string }> };
      setMessages(data.messages ?? []);
    } catch { /* ignore */ }
  }

  function newChat() {
    setActiveSessionId(null);
    setMessages([]);
    setCompletedActions([]);
    inputRef.current?.focus();
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch("/api/buro/mizanai/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSessions((s) => s.filter((s2) => s2.id !== id));
    if (activeSessionId === id) newChat();
  }

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsgId = Date.now().toString();
    setMessages((m) => [...m, { id: userMsgId, role: "user", content: msg }]);
    setLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const assistantId = (Date.now() + 1).toString();
    setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);

    try {
      // Sohbet geçmişini hazırla (son 10 mesaj)
      const historyForAPI = messages.slice(-10).map((m) => ({
        role: m.role,
        content: cleanResponse(m.content),
      }));

      const res = await fetch("/api/buro/mizanai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          sessionId: activeSessionId ?? undefined,
          history: historyForAPI,
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
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          try {
            const json = JSON.parse(raw) as {
              delta?: string;
              sessionId?: string;
              done?: boolean;
              actions?: Action[];
              error?: string;
            };

            if (json.sessionId && !activeSessionId) {
              setActiveSessionId(json.sessionId);
              // Yeni session'ı listeye ekle
              loadSessions();
            }

            if (json.delta) {
              setMessages((m) =>
                m.map((msg2) =>
                  msg2.id === assistantId
                    ? { ...msg2, content: msg2.content + json.delta }
                    : msg2
                )
              );
            }

            if (json.done && json.actions && json.actions.length > 0) {
              setCompletedActions((a) => [...a, ...json.actions!]);
            }
          } catch { /* ignore */ }
        }
      }
    } catch { /* aborted */ }

    setLoading(false);
  }, [input, loading, messages, activeSessionId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const displayMessages = messages.map((m) => ({
    ...m,
    displayContent: m.role === "assistant" ? cleanResponse(m.content) : m.content,
  }));

  return (
    <div className="flex h-full overflow-hidden">

      {/* Sol — Sohbet Geçmişi */}
      <aside className="w-64 flex-shrink-0 bg-[#0f1729] flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e7b743] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-white">MizanAI</p>
              <p className="text-[10px] text-white/30">Hukuki Asistan</p>
            </div>
          </div>
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-white/80 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Sohbet
          </button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-white/20 text-center py-8">Henüz sohbet yok</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-left transition-all group mb-0.5 ${
                  activeSessionId === s.id
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.title}</p>
                  <p className="text-[10px] opacity-40 mt-0.5">
                    {new Date(s.updated_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="hidden group-hover:flex text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))
          )}
        </div>

        {/* Kullanıcı */}
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <p className="text-xs text-white/30 truncate">Av. {lawyerName}</p>
        </div>
      </aside>

      {/* Sağ — Ana Sohbet */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f4f5f7]">

        {/* Tamamlanan aksiyonlar */}
        {completedActions.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-100 flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex items-center gap-3 flex-1 overflow-x-auto">
              {completedActions.map((a, i) => (
                <span key={i} className="text-xs text-green-700 font-medium whitespace-nowrap">
                  {a.type === "takvim" && `✓ Takvime eklendi: ${a.data.baslik}`}
                  {a.type === "dilekce_baslat" && (
                    <button
                      onClick={() => router.push(`/buro/dilekce?konu=${encodeURIComponent(a.data.konu)}`)}
                      className="underline hover:no-underline"
                    >
                      Dilekçe başlat: {a.data.konu}
                    </button>
                  )}
                </span>
              ))}
            </div>
            <button onClick={() => setCompletedActions([])} className="text-green-400 hover:text-green-600 text-xs flex-shrink-0">✕</button>
          </div>
        )}

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Boş durum — karşılama */
            <div className="flex flex-col items-center justify-center h-full px-6 py-10 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a84c] to-[#e7b743] flex items-center justify-center mb-5 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#0f1729] mb-2">
                Günaydın, Av. {firstName}!
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-sm">
                Tüm büro verinize hâkim hukuki asistanınız. Davalar, müvekkiller, takvim, hukuki araştırma ve dilekçe konularında sorularınızı yanıtlarım.
              </p>

              {/* Hızlı Sorular */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_ACTIONS.map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={qa.label}
                      onClick={() => send(qa.label)}
                      className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 transition-all text-left group"
                    >
                      <Icon className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                      <span className="text-xs text-gray-600 group-hover:text-[#0f1729] font-medium">{qa.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
              {displayMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e7b743] flex items-center justify-center flex-shrink-0 mr-3 mt-0.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#0f1729] text-white rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      msg.displayContent ? (
                        <div className="prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-[#0f1729] prose-strong:text-[#0f1729] prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
                          <ReactMarkdown>{msg.displayContent}</ReactMarkdown>
                        </div>
                      ) : loading ? (
                        <span className="flex gap-1 items-center py-1">
                          <span className="w-2 h-2 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      ) : null
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
            <div className="flex-1 relative bg-[#f4f5f7] border border-gray-200 rounded-2xl focus-within:border-[#c9a84c]/50 focus-within:bg-white transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Soru sorun veya talimat verin... (Enter göndermek için)"
                rows={1}
                className="w-full bg-transparent px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none max-h-32 overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              />
            </div>
            {loading ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors flex-shrink-0"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c9a84c] to-[#e7b743] flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-30 flex-shrink-0 shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-2">
            MizanAI büro verilerinize erişir — davalar, müvekkiller, takvim ve finansal bilgiler
          </p>
        </div>

      </div>
    </div>
  );
}
