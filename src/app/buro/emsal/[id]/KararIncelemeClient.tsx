"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, FileText, Sparkles,
  MessageSquare, Loader2, Send, ExternalLink,
  AlertCircle, ChevronRight,
} from "lucide-react";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

interface KararData {
  documentId?: string;
  id?: string;
  court: string;
  case_number: string;
  decision_number?: string;
  decision_date?: string;
  subject: string;
  summary: string;
  source_url?: string;
  content?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type RightTab = "ozet" | "sohbet";

function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

const COURT_BADGE: Record<string, string> = {
  Yargıtay: "bg-[#1a2744]/10 text-[#1a2744]",
  Danıştay: "bg-blue-50 text-blue-700",
  Anayasa: "bg-purple-50 text-purple-700",
  AYM: "bg-purple-50 text-purple-700",
  BAM: "bg-green-50 text-green-700",
};

function getCourtBadge(court: string) {
  for (const [key, val] of Object.entries(COURT_BADGE)) {
    if (court.includes(key)) return val;
  }
  return "bg-gray-100 text-gray-600";
}

export default function KararIncelemeClient({ kararId }: { kararId: string }) {
  const router = useRouter();
  const [karar, setKarar] = useState<KararData | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("ozet");
  const [ozet, setOzet] = useState("");
  const [ozetLoading, setOzetLoading] = useState(false);
  const [ozetDone, setOzetDone] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Önce sessionStorage'dan metadata yükle (anında)
  useEffect(() => {
    const cached = sessionStorage.getItem(`karar_${kararId}`);
    if (cached) {
      try { setKarar(JSON.parse(cached) as KararData); } catch { /* ignore */ }
    }
  }, [kararId]);

  // 2. Arka planda tam metin fetch et
  useEffect(() => {
    async function fetchContent() {
      setContentLoading(true);
      try {
        const res = await fetch(`/api/emsal/document/${encodeURIComponent(kararId)}`);
        const data = await res.json() as { content?: string; source_url?: string; source?: string };
        if (data.content) setContent(data.content);
        if (data.source_url) {
          setKarar((prev) => prev ? { ...prev, source_url: data.source_url } : prev);
        }
      } catch { /* ignore */ }
      setContentLoading(false);
    }
    fetchContent();
  }, [kararId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function buildContext() {
    const k = karar;
    if (!k) return "";
    const parts = [
      `Mahkeme: ${k.court}`,
      `Esas No: ${k.case_number}`,
      k.decision_number ? `Karar No: ${k.decision_number}` : "",
      k.decision_date ? `Tarih: ${formatDate(k.decision_date)}` : "",
      `Konu: ${k.subject}`,
      k.summary ? `Özet: ${k.summary}` : "",
      content ? `\nKarar Metni:\n${content.slice(0, 3000)}` : "",
    ].filter(Boolean);
    return parts.join("\n");
  }

  async function generateOzet() {
    if (!karar || ozetLoading) return;
    setOzetLoading(true);
    setOzetDone(false);
    setOzet("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Aşağıdaki mahkeme kararını hukuki açıdan kapsamlı özetle. Kararın konusunu, hukuki gerekçeleri, sonucu ve avukatlar için pratik önemi belirt.\n\n${buildContext()}`,
          mode: "avukat",
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let buf = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6);
            if (raw === "[DONE]") break;
            try {
              const json = JSON.parse(raw);
              const delta = json.delta ?? json.text ?? "";
              full += delta;
              setOzet(full);
            } catch { /* ignore */ }
          }
        }
      }
      setOzetDone(true);
    } catch { /* ignore */ }
    setOzetLoading(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading || !karar) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", content: userMsg }]);
    setChatLoading(true);
    setChatMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Bu mahkeme kararı hakkında soru: ${userMsg}\n\n${buildContext()}`,
          mode: "avukat",
        }),
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
          if (line.startsWith("data: ")) {
            const raw = line.slice(6);
            if (raw === "[DONE]") break;
            try {
              const json = JSON.parse(raw);
              const delta = json.delta ?? json.text ?? "";
              if (delta) {
                setChatMessages((m) =>
                  m.map((msg, i) => i === m.length - 1 ? { ...msg, content: msg.content + delta } : msg)
                );
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch { /* ignore */ }
    setChatLoading(false);
  }

  async function downloadPDF() {
    if (!karar) return;
    const text = buildContext() + (content ? `\n\n${content}` : "");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `karar-${karar.case_number?.replace(/\//g, "-") ?? kararId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadWord() {
    if (!karar) return;
    try {
      const res = await fetch("/api/buro/dilekce/export-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: buildContext() + (content ? `\n\n${content}` : ""),
          title: `${karar.court} — ${karar.case_number}`,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karar-${karar.case_number?.replace(/\//g, "-") ?? kararId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }

  // Yükleme durumu — sadece sessionStorage bile yoksa
  if (!karar) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getCourtBadge(karar.court)}`}>
                {karar.court}
              </span>
              <span className="text-xs text-gray-400 font-mono">{karar.case_number}</span>
              {karar.decision_number && (
                <span className="text-xs text-gray-400 font-mono">K. {karar.decision_number}</span>
              )}
              {karar.decision_date && (
                <span className="text-xs text-gray-400">{formatDate(karar.decision_date)}</span>
              )}
            </div>
            <h1 className="font-heading text-sm font-bold text-[#0f1729] truncate">
              {karar.subject || "Karar İnceleme"}
            </h1>
          </div>
          {/* İndirme butonları */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {karar.source_url && (
              <a href={karar.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
                <ExternalLink className="w-3 h-3" /> Kaynak
              </a>
            )}
            <button onClick={downloadPDF}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
              <Download className="w-3 h-3" /> TXT
            </button>
            <button onClick={downloadWord}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
              <FileText className="w-3 h-3" /> Word
            </button>
            <button
              onClick={() => { generateOzet(); setRightTab("ozet"); }}
              disabled={ozetLoading}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e7b743] text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Sparkles className="w-3 h-3" />
              {ozetLoading ? "Özetleniyor..." : "AI Özet"}
            </button>
          </div>
        </div>
      </div>

      {/* Body — karar metni sayfa ile birlikte akar, AI paneli sabit kalır */}
      <div className="flex-1 flex items-start">
        {/* SOL: Karar metni */}
        <div className="flex-1 min-w-0 p-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 mb-6 pb-5 border-b border-gray-100">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Mahkeme</p>
                <p className="text-sm font-semibold text-[#0f1729]">{karar.court}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Tarih</p>
                <p className="text-sm font-semibold text-[#0f1729]">{formatDate(karar.decision_date) || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Esas No</p>
                <p className="text-sm font-mono text-[#0f1729]">{karar.case_number}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Karar No</p>
                <p className="text-sm font-mono text-[#0f1729]">{karar.decision_number || "—"}</p>
              </div>
            </div>

            {/* Konu */}
            <h2 className="font-heading text-base font-bold text-[#0f1729] mb-4">{karar.subject}</h2>

            {/* İçerik */}
            {contentLoading && !content && (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#c9a84c]" />
                Tam metin yükleniyor...
              </div>
            )}

            {content ? (
              <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 leading-relaxed bg-gray-50 p-5 rounded-xl">
                {content}
              </pre>
            ) : !contentLoading ? (
              <div>
                {karar.summary && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{karar.summary}</p>
                )}
                <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1">Tam metin şu an erişilemiyor</p>
                    <p className="text-xs text-amber-600">Bedesten API geçici olarak erişilemez durumda. AI özet ve sohbet özellikleri mevcut bilgilerle çalışmaya devam eder.</p>
                    {karar.source_url && (
                      <a href={karar.source_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Adalet Bakanlığı&apos;nda görüntüle
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* SAĞ: AI panel — her zaman açık, kaydırmada ekranda kalır */}
        <div className="w-96 flex-shrink-0 border-l border-gray-200 flex flex-col bg-white sticky top-0 h-screen">
          {/* Sağ sekme başlığı */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => setRightTab("ozet")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all ${
                rightTab === "ozet"
                  ? "text-[#c9a84c] border-b-2 border-[#c9a84c] bg-[#c9a84c]/5"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Özet
            </button>
            <button
              onClick={() => setRightTab("sohbet")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all ${
                rightTab === "sohbet"
                  ? "text-[#0f1729] border-b-2 border-[#0f1729] bg-[#0f1729]/5"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Sohbet
            </button>
          </div>

          {/* Özet paneli */}
          {rightTab === "ozet" && (
            <div className="flex-1 overflow-y-auto p-4">
              {!ozet && !ozetLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <p className="font-heading text-sm font-bold text-[#0f1729] mb-1">AI Özet Oluştur</p>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Kararı hukuki açıdan analiz ederek saniyeler içinde özet üretir
                  </p>
                  <button
                    onClick={generateOzet}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#c9a84c] to-[#e7b743] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Özet Oluştur
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {(ozetLoading || ozet) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-[#c9a84c]" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#c9a84c] uppercase tracking-wider">MizanAI</span>
                    {ozetLoading && <Loader2 className="w-3 h-3 text-[#c9a84c] animate-spin" />}
                    {ozetDone && !ozetLoading && (
                      <button onClick={generateOzet} className="ml-auto text-[10px] text-gray-400 hover:text-[#c9a84c] transition-colors">
                        Yenile
                      </button>
                    )}
                  </div>
                  <div className="text-gray-700 leading-relaxed">
                    <MarkdownRenderer content={ozet} />
                  </div>
                  {ozetLoading && !ozet && (
                    <div className="flex gap-1 mt-2">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sohbet paneli */}
          {rightTab === "sohbet" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0f1729]/5 flex items-center justify-center mb-3">
                      <MessageSquare className="w-6 h-6 text-[#0f1729]/40" />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Bu karar hakkında sorularınızı sorun
                    </p>
                    <div className="mt-3 space-y-2 w-full">
                      {["Bu kararın sonucu nedir?", "Hangi kanun maddelerine dayanıyor?", "Emsal değeri var mı?"].map((q) => (
                        <button key={q} onClick={() => { setChatInput(q); }}
                          className="w-full text-left text-xs text-[#0f1729]/60 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#c9a84c] text-white rounded-br-sm"
                        : "bg-gray-50 text-gray-700 rounded-bl-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        msg.content ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : (
                          <div className="flex gap-1">
                            {[0,1,2].map(j => (
                              <div key={j} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${j*150}ms` }} />
                            ))}
                          </div>
                        )
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex-shrink-0 p-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                    placeholder="Sorunuzu yazın..."
                    className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]"
                  />
                  <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                    className="w-9 h-9 rounded-xl bg-[#0f1729] flex items-center justify-center text-white hover:bg-[#1a2744] disabled:opacity-40 transition-colors flex-shrink-0">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
