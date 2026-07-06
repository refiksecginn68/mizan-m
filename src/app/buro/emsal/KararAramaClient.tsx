"use client";

import { useState, useRef } from "react";
import {
  Search, Zap, BookOpen, FileUp, Filter,
  Loader2, ChevronLeft, ChevronRight,
  FolderPlus, Eye, X, Check, AlertCircle,
  Download, MessageSquare, Sparkles, Send, FileText, Calendar,
} from "lucide-react";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

interface CaseLaw {
  id?: string;
  documentId?: string;
  court: string;
  case_number: string;
  decision_number?: string | null;
  decision_date?: string | null;
  subject: string;
  summary: string;
  source_url?: string;
  score?: number;
}

interface Case {
  id: string;
  title: string;
  case_number?: string;
}

interface Props {
  cases: Case[];
}

type SearchMode = "akilli" | "kelime" | "anlam" | "dosya";
type RightTab = "metin" | "ozet" | "sohbet";

const MODES: { id: SearchMode; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "akilli", label: "Akıllı", icon: Zap, desc: "AI destekli arama" },
  { id: "kelime", label: "Kelime", icon: Search, desc: "Tam kelime eşleşmesi" },
  { id: "anlam",  label: "Anlam",  icon: BookOpen, desc: "Anlam ve bağlam" },
  { id: "dosya",  label: "Dosya",  icon: FileUp, desc: "Evrak yükle, içinden ara" },
];

const COURT_OPTIONS = [
  { value: "all", label: "Tüm Kaynaklar" },
  { value: "yargitay", label: "Yargıtay" },
  { value: "danistay", label: "Danıştay" },
  { value: "anayasa", label: "Anayasa Mahkemesi" },
  { value: "bam_hukuk", label: "BAM Hukuk" },
  { value: "bam_ceza", label: "BAM Ceza" },
  { value: "bolge_idare", label: "Bölge İdare Mahkemesi" },
  { value: "ilk_derece", label: "İlk Derece Mahkemeleri" },
];

const DAIRE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  yargitay: [
    { value: "", label: "Tüm Daireler" },
    ...Array.from({ length: 23 }, (_, i) => ({ value: `${i + 1}hd`, label: `${i + 1}. Hukuk Dairesi` })),
    { value: "ceza_gk", label: "Ceza Genel Kurulu" },
    { value: "hukuk_gk", label: "Hukuk Genel Kurulu" },
    { value: "1cd", label: "1. Ceza Dairesi" },
    { value: "2cd", label: "2. Ceza Dairesi" },
    { value: "3cd", label: "3. Ceza Dairesi" },
    { value: "4cd", label: "4. Ceza Dairesi" },
    { value: "5cd", label: "5. Ceza Dairesi" },
  ],
  danistay: [
    { value: "", label: "Tüm Daireler" },
    ...Array.from({ length: 17 }, (_, i) => ({ value: `${i + 1}d`, label: `${i + 1}. Daire` })),
    { value: "idgk", label: "İdari Dava Daireleri Kurulu" },
    { value: "vdgk", label: "Vergi Dava Daireleri Kurulu" },
  ],
  bam_hukuk: [
    { value: "", label: "Tüm Daireler" },
    { value: "1", label: "1. Hukuk Dairesi" },
    { value: "2", label: "2. Hukuk Dairesi" },
    { value: "3", label: "3. Hukuk Dairesi" },
    { value: "4", label: "4. Hukuk Dairesi" },
    { value: "5", label: "5. Hukuk Dairesi" },
  ],
  bam_ceza: [
    { value: "", label: "Tüm Daireler" },
    { value: "1", label: "1. Ceza Dairesi" },
    { value: "2", label: "2. Ceza Dairesi" },
    { value: "3", label: "3. Ceza Dairesi" },
  ],
};

const COURT_BADGE: Record<string, string> = {
  Yargıtay: "bg-[#1a2744]/10 text-[#1a2744]",
  Danıştay: "bg-blue-50 text-blue-700",
  "Anayasa Mahkemesi": "bg-purple-50 text-purple-700",
  AYM: "bg-purple-50 text-purple-700",
  BAM: "bg-green-50 text-green-700",
};

function getCourtBadge(court: string) {
  for (const [key, val] of Object.entries(COURT_BADGE)) {
    if (court.includes(key)) return val;
  }
  return "bg-gray-100 text-gray-600";
}

function getId(item: CaseLaw) {
  return item.documentId || item.id || "";
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
      : part
  );
}

// Gerçek alaka skoru: backend karar tam metni üzerinden hesaplar (0..1).
// Skor yoksa gösterge gizlenir — uydurma skor gösterilmez.
function matchScore(item: CaseLaw): number | null {
  if (typeof item.score === "number") return Math.round(item.score * 100);
  return null;
}

// Metin satır kaydırma yardımcı fonksiyonu (pdf-lib için)
async function wrapTextLines(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  fontSize: number,
  maxWidth: number
): Promise<string[]> {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) { lines.push(""); continue; }
    const words = para.split(" ");
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const w = font.widthOfTextAtSize(test, fontSize);
      if (w > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export default function KararAramaClient({ cases }: Props) {
  // Arama state
  const [mode, setMode] = useState<SearchMode>("akilli");
  const [query, setQuery] = useState("");
  const [court, setCourt] = useState("all");
  const [daire, setDaire] = useState("");
  const [esasNo, setEsasNo] = useState("");
  const [kararNo, setKararNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"alakalilik" | "guncel" | "eski" | "daire">("alakalilik");
  const [belgeTuru, setBelgeTuru] = useState("");
  const [ozetDurumu, setOzetDurumu] = useState<"" | "ozetli" | "ozetsiz">("");
  const [results, setResults] = useState<CaseLaw[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [source, setSource] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sağ panel state
  const [selectedKarar, setSelectedKarar] = useState<CaseLaw | null>(null);
  const [contentFull, setContentFull] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [ozetText, setOzetText] = useState("");
  const [ozetLoading, setOzetLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("metin");

  // Dosyaya ekle state
  const [dosyaModalOpen, setDosyaModalOpen] = useState(false);
  const [dosyaEklendi, setDosyaEklendi] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
  function showToast(text: string, type: "error" | "success" = "error") {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  }

  // Eski liste-üzeri modal (liste kartındaki dosyaya ekle için ayrı)
  const [dosyaModalId, setDosyaModalId] = useState<string | null>(null);
  const [dosyaEklendiList, setDosyaEklendiList] = useState<string | null>(null);
  const [fileLoadingList, setFileLoadingList] = useState(false);

  // Karar seç + içerik çek
  async function selectKarar(item: CaseLaw) {
    setSelectedKarar(item);
    setRightTab("metin");
    setContentFull(null);
    setOzetText("");
    setChatMessages([]);
    const id = getId(item);
    if (!id) return;
    setContentLoading(true);
    try {
      const res = await fetch(`/api/emsal/document/${encodeURIComponent(id)}`);
      const data = await res.json() as { content?: string; full_text?: string };
      setContentFull(data.content ?? data.full_text ?? null);
    } catch {
      setContentFull(null);
    } finally {
      setContentLoading(false);
    }
  }

  // Panel kapat
  function closePanel() {
    setSelectedKarar(null);
    setContentFull(null);
    setOzetText("");
    setChatMessages([]);
    setRightTab("metin");
    setDosyaModalOpen(false);
    setDosyaEklendi(null);
  }

  // PDF indirme — Türkçe karakter desteği için DejaVu Sans + fontkit
  async function downloadPDF() {
    if (!selectedKarar) return;
    try {
    const { PDFDocument, rgb } = await import("pdf-lib");
    const fontkit = (await import("@pdf-lib/fontkit")).default;
    const fontBytes = await fetch("/fonts/DejaVuSans.ttf").then((r) => r.arrayBuffer());
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(fontBytes, { subset: true });
    const fontSize = 10;
    const margin = 50;
    const lineHeight = fontSize * 1.5;

    const buildKararText = () => [
      `Mahkeme: ${selectedKarar.court}`,
      `Esas No: ${selectedKarar.case_number}`,
      selectedKarar.decision_number ? `Karar No: ${selectedKarar.decision_number}` : "",
      selectedKarar.decision_date ? `Tarih: ${selectedKarar.decision_date}` : "",
      `Konu: ${selectedKarar.subject}`,
      "",
      contentFull || selectedKarar.summary || "",
    ].filter((l) => l !== undefined).join("\n");

    const text = buildKararText();
    const page0 = pdfDoc.addPage([595, 842]);
    const maxWidth = page0.getSize().width - margin * 2;
    const lines = await wrapTextLines(text, font, fontSize, maxWidth);

    let currentPage = page0;
    let y = currentPage.getSize().height - margin;

    for (const line of lines) {
      if (y < margin) {
        currentPage = pdfDoc.addPage([595, 842]);
        y = currentPage.getSize().height - margin;
      }
      if (line) {
        currentPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
      }
      y -= lineHeight;
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `karar-${selectedKarar.case_number?.replace(/\//g, "-") ?? "indirilen"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF error:", err);
      showToast("PDF oluşturulurken hata oluştu.");
    }
  }

  // UDF indirme
  async function downloadUDF() {
    if (!selectedKarar) return;
    const content = [
      `Mahkeme: ${selectedKarar.court}`,
      `Esas No: ${selectedKarar.case_number}`,
      `Konu: ${selectedKarar.subject}`,
      contentFull || selectedKarar.summary || "",
    ].join("\n\n");

    try {
      const res = await fetch("/api/buro/uyap/udf-hazirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "karar", content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karar-${selectedKarar.case_number?.replace(/\//g, "-") ?? "indirilen"}.udf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("UDF oluşturulurken hata oluştu.");
    }
  }

  // Word indirme
  async function downloadWord() {
    if (!selectedKarar) return;
    const content = [
      `Mahkeme: ${selectedKarar.court}`,
      `Esas No: ${selectedKarar.case_number}`,
      `Konu: ${selectedKarar.subject}`,
      "",
      contentFull || selectedKarar.summary || "",
    ].join("\n\n");

    try {
      const res = await fetch("/api/buro/dilekce/export-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metin: content, baslik: `Karar ${selectedKarar.case_number}` }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karar-${selectedKarar.case_number?.replace(/\//g, "-") ?? "indirilen"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Word dosyası oluşturulurken hata oluştu.");
    }
  }

  // AI Özet
  async function generateOzet() {
    if (ozetLoading || !selectedKarar) return;
    setOzetLoading(true);
    setOzetText("");
    const context = `${selectedKarar.court} - ${selectedKarar.case_number}\n${selectedKarar.subject}\n${selectedKarar.summary}\n${contentFull?.slice(0, 3000) ?? ""}`;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Bu mahkeme kararını hukuki açıdan özetle:\n${context}`,
          mode: "avukat",
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let buf = "", full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6)) as { delta?: string; text?: string };
            const delta = json.delta ?? json.text ?? "";
            full += delta;
            setOzetText(full);
          } catch { /* devam et */ }
        }
      }
    } catch { /* ignore */ }
    setOzetLoading(false);
  }

  // Sohbet
  async function sendChat() {
    if (!chatInput.trim() || chatLoading || !selectedKarar) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    const context = `Karar Bilgisi: ${selectedKarar.court} - ${selectedKarar.case_number}\n${selectedKarar.subject}\n${contentFull?.slice(0, 2000) ?? selectedKarar.summary}`;
    const fullMessage = `${context}\n\nSoru: ${userMsg}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullMessage, mode: "avukat" }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let buf = "", full = "";
      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6)) as { delta?: string; text?: string };
            const delta = json.delta ?? json.text ?? "";
            full += delta;
            setChatMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: full };
              return updated;
            });
          } catch { /* devam et */ }
        }
      }
    } catch { /* ignore */ }
    setChatLoading(false);
  }

  // Panel dosyaya ekle
  async function dosyaEklePanelFn(caseId: string) {
    if (!selectedKarar) return;
    setFileLoading(true);
    try {
      await fetch("/api/buro/emsal-dosya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          karar_id: getId(selectedKarar),
          court: selectedKarar.court,
          case_number: selectedKarar.case_number,
          subject: selectedKarar.subject,
          summary: selectedKarar.summary,
          decision_date: selectedKarar.decision_date,
        }),
      });
      setDosyaEklendi(caseId);
      setTimeout(() => {
        setDosyaModalOpen(false);
        setDosyaEklendi(null);
      }, 1500);
    } catch { /* ignore */ }
    setFileLoading(false);
  }

  // Liste kartı dosyaya ekle
  async function dosyaEkleList(caseId: string, karar: CaseLaw) {
    setFileLoadingList(true);
    try {
      await fetch("/api/buro/emsal-dosya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          karar_id: getId(karar),
          court: karar.court,
          case_number: karar.case_number,
          subject: karar.subject,
          summary: karar.summary,
          decision_date: karar.decision_date,
        }),
      });
      setDosyaEklendiList(getId(karar));
      setTimeout(() => {
        setDosyaModalId(null);
        setDosyaEklendiList(null);
      }, 1500);
    } catch { /* ignore */ }
    setFileLoadingList(false);
  }

  async function doSearch(q: string, c: string, p: number, mod: SearchMode, sortOverride?: typeof sortBy) {
    // Sorgu boş olsa da esas/karar no veya tarih filtresi varsa ara
    const hasFilter = !!(esasNo.trim() || kararNo.trim() || startDate || endDate);
    if (!q.trim() && !hasFilter && mod !== "dosya") return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        q,
        court: c,
        page: String(p),
        mode: mod,
        sort: sortOverride ?? sortBy,
      });
      if (esasNo) params.set("esas", esasNo);
      if (kararNo) params.set("karar", kararNo);
      if (daire) params.set("daire", daire);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (belgeTuru) params.set("belge_turu", belgeTuru);
      if (ozetDurumu) params.set("ozet", ozetDurumu);
      const res = await fetch(`/api/emsal/search?${params}`);
      const data = await res.json() as { results: CaseLaw[]; total: number; source: string };
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
      setSource(data.source ?? "");
      setPage(p);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSearch() {
    if (!uploadedFile) return;
    setLoading(true);
    setSearched(true);
    const form = new FormData();
    form.append("file", uploadedFile);
    try {
      const res = await fetch("/api/emsal/search-file", { method: "POST", body: form });
      const data = await res.json() as { results: CaseLaw[]; total: number; extractedQuery: string };
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
      setQuery(data.extractedQuery ?? "");
      setSource("file");
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // ─── Arama sonuçları listesi (hem standalone hem split view'da kullanılır)
  const SearchResults = (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Sonuç bilgisi */}
      {searched && !loading && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap className={`w-3.5 h-3.5 ${source === "live" ? "text-green-500" : "text-gray-400"}`} />
            <span>
              {source === "live" && "Canlı · "}
              {source === "cache" && "Önbellek · "}
              {source === "file" && "Belgeden · "}
              <strong className="text-gray-800">{total} sonuç</strong>
            </span>
          </div>
        </div>
      )}

      {/* Yükleniyor skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 w-24 bg-gray-100 rounded-full mb-2" />
              <div className="h-3 w-3/4 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Sonuç kartları */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((item) => {
            const id = getId(item);
            const score = matchScore(item);
            const dateStr = item.decision_date
              ? new Date(item.decision_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
              : "";
            const isSelected = selectedKarar && getId(selectedKarar) === id;

            return (
              <div
                key={id}
                onClick={() => selectKarar(item)}
                className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#c9a84c] shadow-md"
                    : "border-gray-100 hover:border-[#c9a84c]/60 hover:shadow-sm"
                }`}
              >
                {/* Badges */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getCourtBadge(item.court)}`}>
                    {item.court}
                  </span>
                  {dateStr && <span className="text-[10px] text-gray-400">{dateStr}</span>}
                  {item.case_number && (
                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[100px]">{item.case_number}</span>
                  )}
                </div>

                {/* Konu */}
                <h3 className="font-heading text-xs font-bold text-[#0f1729] mb-1 leading-snug line-clamp-2">
                  {highlightText(item.subject, query)}
                </h3>

                {/* Özet */}
                <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 mb-2">
                  {highlightText(item.summary, query)}
                </p>

                {/* Eşleşme + Butonlar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {score !== null && (
                      <>
                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${score >= 90 ? "bg-green-500" : score >= 70 ? "bg-[#c9a84c]" : "bg-gray-300"}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${score >= 90 ? "text-green-600" : score >= 70 ? "text-[#c9a84c]" : "text-gray-400"}`}>
                          %{score}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDosyaModalId(id); }}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                    >
                      <FolderPlus className="w-3 h-3 inline mr-0.5" />
                      Ekle
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); selectKarar(item); }}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-[#c9a84c] text-white"
                          : "bg-[#0f1729] text-white hover:bg-[#1a2744]"
                      }`}
                    >
                      <Eye className="w-3 h-3 inline mr-0.5" />
                      İncele
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama */}
      {!loading && total > 10 && results.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => doSearch(query, court, page - 1, mode)} disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-[#c9a84c] disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Önceki
          </button>
          <span className="text-xs text-gray-500">{page} / {Math.ceil(total / 10)}</span>
          <button onClick={() => doSearch(query, court, page + 1, mode)} disabled={page >= Math.ceil(total / 10)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-[#c9a84c] disabled:opacity-40 transition-colors">
            Sonraki <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Boş durum */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-3">
            <Search className="w-7 h-7 text-[#c9a84c]" />
          </div>
          <p className="font-heading text-sm font-bold text-[#0f1729] mb-1">Arama yapın</p>
          <p className="text-xs text-gray-400">Yargıtay, Danıştay ve 50+ kaynakta arama yapın</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
          <p className="font-heading text-sm font-bold text-[#0f1729] mb-1">Sonuç bulunamadı</p>
          <p className="text-xs text-gray-400">Farklı anahtar kelimeler deneyin</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toastMsg.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          {toastMsg.text}
        </div>
      )}
      {/* Başlık + Arama */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0f1729]">Milyonlarca İçtihatta Arama</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                <Zap className="w-3 h-3" /> AI Destekli
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-center">
            <div>
              <p className="font-heading text-lg font-bold text-[#0f1729]">10M+</p>
              <p className="text-[10px] text-gray-400">Karar</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="font-heading text-lg font-bold text-[#0f1729]">Günlük</p>
              <p className="text-[10px] text-gray-400">Güncelleme</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="font-heading text-lg font-bold text-[#0f1729]">50+</p>
              <p className="text-[10px] text-gray-400">Kaynak</p>
            </div>
          </div>
        </div>

        {/* Arama kutusu */}
        <div className="bg-[#f9f9f9] border border-gray-200 rounded-2xl p-4">
          {mode !== "dosya" ? (
            <div className="flex items-center gap-3 mb-3">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch(query, court, 1, mode)}
                placeholder="Dava özeti veya anahtar kelimeleri yazın..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                onClick={() => doSearch(query, court, 1, mode)}
                disabled={loading || (!query.trim() && !esasNo.trim() && !kararNo.trim() && !startDate && !endDate)}
                className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e7b743] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Ara</>}
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#c9a84c] transition-colors mb-3"
            >
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.udf"
                onChange={(e) => e.target.files?.[0] && setUploadedFile(e.target.files[0])} />
              <FileUp className="w-8 h-8 text-gray-300" />
              {uploadedFile ? (
                <p className="text-sm font-semibold text-[#1a2744]">{uploadedFile.name}</p>
              ) : (
                <p className="text-sm text-gray-400">UDF, PDF, DOCX veya TXT yükleyin</p>
              )}
              {uploadedFile && (
                <button onClick={(e) => { e.stopPropagation(); handleFileSearch(); }}
                  className="bg-[#c9a84c] text-white text-sm font-semibold px-5 py-2 rounded-xl mt-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Bu Belgede Ara"}
                </button>
              )}
            </div>
          )}

          {/* Mod seçici */}
          <div className="flex items-center gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === m.id ? "bg-[#c9a84c] text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
            <span className="text-[10px] text-gray-400 ml-1">
              {MODES.find((m2) => m2.id === mode)?.desc}
            </span>
          </div>
        </div>

        {/* Filtreler */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                showFilters ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5" : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtrele
            </button>
            {/* Sıralama — her zaman görünür, değişince arama yenilenir */}
            <select value={sortBy}
              onChange={(e) => {
                const val = e.target.value as typeof sortBy;
                setSortBy(val);
                if (searched) doSearch(query, court, 1, mode, val);
              }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c]">
              <option value="alakalilik">↑ Alakalılık</option>
              <option value="guncel">↓ En Yeni (Karar Tarihi)</option>
              <option value="eski">↑ En Eski (Karar Tarihi)</option>
              <option value="daire">Mahkeme / Daire</option>
            </select>
            {/* Aktif filtre sayısı */}
            {(court !== "all" || daire || esasNo || kararNo || startDate || endDate || belgeTuru || ozetDurumu) && (
              <button
                onClick={() => {
                  setCourt("all"); setDaire(""); setEsasNo(""); setKararNo("");
                  setStartDate(""); setEndDate(""); setBelgeTuru(""); setOzetDurumu("");
                }}
                className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                ✕ Filtreleri Temizle
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                {/* Mahkeme */}
                <select value={court} onChange={(e) => { setCourt(e.target.value); setDaire(""); }}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c]">
                  {COURT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Daire - seçilen mahkemeye göre dinamik */}
                {DAIRE_OPTIONS[court] && (
                  <select value={daire} onChange={(e) => setDaire(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c]">
                    {DAIRE_OPTIONS[court].map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                )}

                {/* Belge Türü */}
                <select value={belgeTuru} onChange={(e) => setBelgeTuru(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c]">
                  <option value="">Tüm Belge Türleri</option>
                  <option value="mahkeme_karari">Mahkeme Kararı</option>
                  <option value="bilirkisi_raporu">Bilirkişi Raporu</option>
                  <option value="dava_dilekce">Dava Dilekçesi</option>
                  <option value="dilekce">Dilekçe</option>
                  <option value="durusma_tutanagi">Duruşma Tutanağı</option>
                  <option value="hukuki_yazisma">Hukuki Yazışma</option>
                  <option value="kyok">KYOK</option>
                  <option value="savcilik_karari">Savcılık Kararı</option>
                  <option value="sozlesme">Sözleşme</option>
                  <option value="tedbir_karari">Tedbir Kararı</option>
                  <option value="tensip_tutanagi">Tensip Tutanağı</option>
                  <option value="iddianame">İddianame</option>
                </select>

                {/* Özet durumu */}
                <select value={ozetDurumu} onChange={(e) => setOzetDurumu(e.target.value as typeof ozetDurumu)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c]">
                  <option value="">Tümü</option>
                  <option value="ozetli">Özetli</option>
                  <option value="ozetsiz">Özetsiz</option>
                </select>

                {/* Esas / Karar No */}
                <input value={esasNo} onChange={(e) => setEsasNo(e.target.value)}
                  placeholder="Esas No  2010/17762"
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c] w-40" />
                <input value={kararNo} onChange={(e) => setKararNo(e.target.value)}
                  placeholder="Karar No  2010/30253"
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c] w-40" />

                {/* Tarih aralığı */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c] w-34" />
                  <span className="text-gray-400 text-xs">—</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c] w-34" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ana içerik alanı */}
      <div className="flex-1 overflow-hidden flex">
        {selectedKarar ? (
          /* ── SPLIT VIEW: Sol liste + Sağ panel ── */
          <>
            {/* Sol: Arama sonuçları listesi */}
            <div className="w-96 flex-shrink-0 border-r border-gray-200 bg-[#f8f9fa] flex flex-col overflow-hidden">
              {SearchResults}
            </div>

            {/* Sağ: Karar detay paneli */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Panel başlık */}
              <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
                <button onClick={closePanel} className="text-gray-400 hover:text-gray-700 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading text-sm font-bold text-[#0f1729] truncate">{selectedKarar.subject}</h2>
                  <p className="text-xs text-gray-400">
                    {selectedKarar.court}
                    {selectedKarar.case_number && ` · ${selectedKarar.case_number}`}
                    {selectedKarar.decision_date && ` · ${new Date(selectedKarar.decision_date).toLocaleDateString("tr-TR")}`}
                  </p>
                </div>
                {/* Butonlar */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button
                    onClick={downloadUDF}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                  >
                    <FileText className="w-3 h-3" /> UDF
                  </button>
                  <button
                    onClick={downloadWord}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                  >
                    <FileText className="w-3 h-3" /> Word
                  </button>
                  <button
                    onClick={() => setDosyaModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                  >
                    <FolderPlus className="w-3 h-3" /> Dosyaya Ekle
                  </button>
                </div>
              </div>

              {/* Sekme çubuğu */}
              <div className="border-b border-gray-100 px-5 flex gap-1 flex-shrink-0 bg-white">
                {(["metin", "ozet", "sohbet"] as RightTab[]).map((tab) => {
                  const labels: Record<RightTab, string> = { metin: "Karar Metni", ozet: "AI Özet", sohbet: "Sohbet" };
                  const icons: Record<RightTab, React.ElementType> = { metin: FileText, ozet: Sparkles, sohbet: MessageSquare };
                  const Icon = icons[tab];
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setRightTab(tab);
                        if (tab === "ozet" && !ozetText && !ozetLoading) generateOzet();
                      }}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                        rightTab === tab
                          ? "border-[#c9a84c] text-[#c9a84c]"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Panel içerik */}
              <div className="flex-1 overflow-y-auto">
                {/* Karar Metni */}
                {rightTab === "metin" && (
                  <div className="p-6">
                    {/* Karar bilgileri */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { label: "Mahkeme", value: selectedKarar.court },
                        { label: "Esas No", value: selectedKarar.case_number },
                        { label: "Karar No", value: selectedKarar.decision_number ?? "-" },
                        { label: "Tarih", value: selectedKarar.decision_date ? new Date(selectedKarar.decision_date).toLocaleDateString("tr-TR") : "-" },
                      ].map((field) => (
                        <div key={field.label} className="bg-[#f8f9fa] rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 mb-0.5">{field.label}</p>
                          <p className="text-xs font-semibold text-[#0f1729]">{field.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Özet</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedKarar.summary}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tam Metin</h3>
                      {contentLoading ? (
                        <div className="flex items-center gap-2 py-8 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Karar metni yükleniyor...</span>
                        </div>
                      ) : contentFull ? (
                        <div className="bg-[#f8f9fa] rounded-xl p-4">
                          <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{contentFull}</pre>
                        </div>
                      ) : (
                        <div className="bg-[#f8f9fa] rounded-xl p-4 text-center">
                          <p className="text-sm text-gray-500">Tam metin bu karar için mevcut değil.</p>
                          {selectedKarar.source_url && (
                            <a href={selectedKarar.source_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#c9a84c] hover:underline mt-1 inline-block">
                              Kaynakta görüntüle →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Özet */}
                {rightTab === "ozet" && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">AI Hukuki Özet</h3>
                      {!ozetLoading && ozetText && (
                        <button
                          onClick={generateOzet}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                        >
                          <Sparkles className="w-3 h-3" /> Yenile
                        </button>
                      )}
                    </div>
                    {ozetLoading && !ozetText && (
                      <div className="flex items-center gap-2 py-8 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Özet oluşturuluyor...</span>
                      </div>
                    )}
                    {ozetText && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                        <MarkdownRenderer content={ozetText} />
                        {ozetLoading && <span className="inline-block w-1.5 h-4 bg-purple-400 animate-pulse ml-0.5 align-middle" />}
                      </div>
                    )}
                    {!ozetLoading && !ozetText && (
                      <div className="text-center py-8">
                        <button
                          onClick={generateOzet}
                          className="flex items-center gap-2 mx-auto bg-gradient-to-r from-[#c9a84c] to-[#e7b743] text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
                        >
                          <Sparkles className="w-4 h-4" /> Özet Oluştur
                        </button>
                        <p className="text-xs text-gray-400 mt-2">AI bu kararı hukuki açıdan analiz edecek</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sohbet */}
                {rightTab === "sohbet" && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Bu karar hakkında soru sorun</p>
                          <p className="text-xs text-gray-400 mt-1">AI, karar içeriğine göre yanıtlayacak</p>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-[#0f1729] text-white rounded-br-sm"
                              : "bg-[#f8f9fa] text-gray-800 rounded-bl-sm border border-gray-100"
                          }`}>
                            {msg.content}
                            {msg.role === "assistant" && chatLoading && i === chatMessages.length - 1 && (
                              <span className="inline-block w-1 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Chat input */}
                    <div className="border-t border-gray-100 p-4 flex-shrink-0">
                      <div className="flex items-center gap-2 bg-[#f8f9fa] border border-gray-200 rounded-xl px-3 py-2">
                        <input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                          placeholder="Bu karar hakkında soru sorun..."
                          className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                        />
                        <button
                          onClick={sendChat}
                          disabled={!chatInput.trim() || chatLoading}
                          className="w-8 h-8 rounded-lg bg-[#c9a84c] text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
                        >
                          {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ── NORMAL VIEW: Tam genişlik arama sonuçları ── */
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Sonuç bilgisi */}
            {searched && !loading && (
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Zap className={`w-4 h-4 ${source === "live" ? "text-green-500" : "text-gray-400"}`} />
                  <span>
                    {source === "live" && "Canlı · "}
                    {source === "cache" && "Önbellek · "}
                    {source === "file" && "Belgeden · "}
                    <strong className="text-gray-800">{total} sonuç</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Sırala:</span>
                  <span className="font-semibold text-gray-600">
                    {sortBy === "alakalilik" ? "Alakalılık" : sortBy === "guncel" ? "En Yeni" : sortBy === "eski" ? "En Eski" : "Mahkeme/Daire"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Yükleniyor */}
              {loading && (
                <div className="space-y-3 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-5 w-24 bg-gray-100 rounded-full" />
                        <div className="h-4 w-16 bg-gray-100 rounded" />
                      </div>
                      <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
                      <div className="h-3 w-full bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {/* Sonuç kartları (geniş) */}
              {!loading && results.length > 0 && (
                <div className="space-y-3 pt-2">
                  {results.map((item) => {
                    const id = getId(item);
                    const score = matchScore(item);
                    const dateStr = item.decision_date
                      ? new Date(item.decision_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
                      : "";

                    return (
                      <div key={id} onClick={() => selectKarar(item)}
                        className="bg-white rounded-2xl border border-gray-100 hover:border-[#c9a84c]/60 hover:shadow-md transition-all p-5 cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCourtBadge(item.court)}`}>
                                {item.court}
                              </span>
                              {dateStr && <span className="text-xs text-gray-400">{dateStr}</span>}
                              {item.case_number && <span className="text-xs text-gray-400 font-mono">{item.case_number}</span>}
                              {item.decision_number && <span className="text-xs text-gray-400 font-mono">K. {item.decision_number}</span>}
                            </div>
                            <h3 className="font-heading text-sm font-bold text-[#0f1729] mb-1.5 leading-snug">{item.subject}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{item.summary}</p>
                          </div>
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            {score !== null && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${score >= 90 ? "bg-green-500" : score >= 70 ? "bg-[#c9a84c]" : "bg-gray-300"}`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${score >= 90 ? "text-green-600" : score >= 70 ? "text-[#c9a84c]" : "text-gray-400"}`}>
                                  %{score}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setDosyaModalId(id); }}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                              >
                                <FolderPlus className="w-3.5 h-3.5" />
                                Dosyaya Ekle
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); selectKarar(item); }}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Kararı İncele
                              </button>
                            </div>
                          </div>
                        </div>
                        {id && (
                          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                            <span className="text-[10px] text-gray-300 font-mono truncate flex-1">ID: {id.slice(0, 32)}...</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sayfalama */}
              {!loading && total > 10 && results.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={() => doSearch(query, court, page - 1, mode)} disabled={page === 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#c9a84c] disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Önceki
                  </button>
                  <span className="text-sm text-gray-500">{page} / {Math.ceil(total / 10)}</span>
                  <button onClick={() => doSearch(query, court, page + 1, mode)} disabled={page >= Math.ceil(total / 10)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#c9a84c] disabled:opacity-40 transition-colors">
                    Sonraki <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Boş durum */}
              {!loading && !searched && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-[#c9a84c]" />
                  </div>
                  <p className="font-heading text-base font-bold text-[#0f1729] mb-1">Arama yapın</p>
                  <p className="text-sm text-gray-400">Yargıtay, Danıştay ve 50+ kaynakta arama yapın</p>
                </div>
              )}

              {!loading && searched && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="font-heading text-base font-bold text-[#0f1729] mb-1">Sonuç bulunamadı</p>
                  <p className="text-sm text-gray-400">Farklı anahtar kelimeler deneyin</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panel - Dosyaya Ekle Modal */}
      {dosyaModalOpen && selectedKarar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-bold text-[#0f1729]">Dosyaya Ekle</h3>
              <button onClick={() => { setDosyaModalOpen(false); setDosyaEklendi(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {dosyaEklendi ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-700">Dosyaya eklendi!</p>
              </div>
            ) : cases.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aktif dava bulunamadı.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">Hangi dosyaya eklemek istiyorsunuz?</p>
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => dosyaEklePanelFn(c.id)}
                    disabled={fileLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-[#c9a84c] hover:bg-[#c9a84c]/5 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0f1729]/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#0f1729]/50">{c.case_number?.slice(0, 4) ?? "---"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0f1729] truncate">{c.title}</p>
                      {c.case_number && <p className="text-[10px] text-gray-400">{c.case_number}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste kartı - Dosyaya Ekle Modal */}
      {dosyaModalId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-bold text-[#0f1729]">Dosyaya Ekle</h3>
              <button onClick={() => setDosyaModalId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {dosyaEklendiList ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-700">Dosyaya eklendi!</p>
              </div>
            ) : cases.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aktif dava bulunamadı.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">Hangi dosyaya eklemek istiyorsunuz?</p>
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => dosyaEkleList(c.id, results.find((r) => getId(r) === dosyaModalId)!)}
                    disabled={fileLoadingList}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-[#c9a84c] hover:bg-[#c9a84c]/5 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0f1729]/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#0f1729]/50">{c.case_number?.slice(0, 4) ?? "---"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0f1729] truncate">{c.title}</p>
                      {c.case_number && <p className="text-[10px] text-gray-400">{c.case_number}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
