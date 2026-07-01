"use client";

import { useState } from "react";
import {
  Search, Scale, Calendar, Building2, FileText,
  ChevronRight, ExternalLink, Loader2, Zap, X, Download,
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
}

interface EmsalSearchProps {
  initialResults?: CaseLaw[];
}

const QUICK_SEARCHES = [
  "iş hukuku haksız fesih",
  "kira tahliye",
  "tüketici hakem heyeti",
  "boşanma nafaka",
  "kıdem tazminatı",
  "miras taksim",
];

const COURTS = [
  { value: "all",      label: "Tümü" },
  { value: "yargitay", label: "Yargıtay" },
  { value: "danistay", label: "Danıştay" },
  { value: "anayasa",  label: "Anayasa Mah." },
  { value: "bam_hukuk",label: "BAM Hukuk" },
  { value: "bam_ceza", label: "BAM Ceza" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Alakalılık" },
  { value: "newest",    label: "En Güncel" },
  { value: "oldest",    label: "En Eski" },
];

const COURT_COLORS: Record<string, string> = {
  Yargıtay:           "bg-primary/10 text-primary",
  Danıştay:           "bg-blue-50 text-blue-700",
  "Anayasa Mahkemesi":"bg-purple-50 text-purple-700",
  BAM:                "bg-green-50 text-green-700",
};

function getCourtColor(court: string) {
  for (const [key, val] of Object.entries(COURT_COLORS)) {
    if (court.includes(key)) return val;
  }
  return "bg-muted text-muted-foreground";
}

function getId(item: CaseLaw) {
  return item.documentId || item.id || "";
}

function sortResults(results: CaseLaw[], sort: string): CaseLaw[] {
  if (sort === "newest") {
    return [...results].sort((a, b) => {
      if (!a.decision_date) return 1;
      if (!b.decision_date) return -1;
      return new Date(b.decision_date).getTime() - new Date(a.decision_date).getTime();
    });
  }
  if (sort === "oldest") {
    return [...results].sort((a, b) => {
      if (!a.decision_date) return 1;
      if (!b.decision_date) return -1;
      return new Date(a.decision_date).getTime() - new Date(b.decision_date).getTime();
    });
  }
  return results;
}

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

export default function EmsalSearch({ initialResults = [] }: EmsalSearchProps) {
  const [query, setQuery]         = useState("");
  const [court, setCourt]         = useState("all");
  const [sort, setSort]           = useState("relevance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [results, setResults]     = useState<CaseLaw[]>(initialResults);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [source, setSource]       = useState<string>("");

  // Sağ panel
  const [selected, setSelected]       = useState<CaseLaw | null>(null);
  const [content, setContent]         = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [ozetText, setOzetText]       = useState("");
  const [ozetLoading, setOzetLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState<"metin" | "ozet">("metin");

  async function doSearch(q: string, c: string, p: number) {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q, court: c, page: String(p) });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    doSearch(query, court, 1);
  }

  async function selectKarar(item: CaseLaw) {
    setSelected(item);
    setActiveTab("metin");
    setContent(null);
    setOzetText("");
    const id = getId(item);
    if (!id) return;
    setContentLoading(true);
    try {
      const res = await fetch(`/api/emsal/document/${encodeURIComponent(id)}`);
      const data = await res.json() as { content?: string; full_text?: string };
      setContent(data.content ?? data.full_text ?? null);
    } catch { /* ignore */ }
    setContentLoading(false);
  }

  async function generateOzet() {
    if (!selected || ozetLoading) return;
    setOzetLoading(true);
    setOzetText("");
    const context = `${selected.court} - ${selected.case_number}\n${selected.subject}\n${selected.summary}\n${content?.slice(0, 3000) ?? ""}`;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Bu mahkeme kararını hukuki açıdan özetle:\n${context}`, mode: "vatandas" }),
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
            full += json.delta ?? json.text ?? "";
            setOzetText(full);
          } catch { /* devam */ }
        }
      }
    } catch { /* ignore */ }
    setOzetLoading(false);
  }

  async function downloadPDF() {
    if (!selected) return;
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const margin = 50;
    const lineHeight = fontSize * 1.5;
    const text = [
      `Mahkeme: ${selected.court}`,
      `Esas No: ${selected.case_number}`,
      selected.decision_number ? `Karar No: ${selected.decision_number}` : "",
      selected.decision_date ? `Tarih: ${selected.decision_date}` : "",
      `Konu: ${selected.subject}`,
      "",
      content || selected.summary || "",
    ].filter(Boolean).join("\n");

    const page0 = pdfDoc.addPage([595, 842]);
    const maxWidth = page0.getSize().width - margin * 2;
    const lines = await wrapTextLines(text, font, fontSize, maxWidth);
    let currentPage = page0;
    let y = currentPage.getSize().height - margin;
    for (const line of lines) {
      if (y < margin) { currentPage = pdfDoc.addPage([595, 842]); y = currentPage.getSize().height - margin; }
      if (line) currentPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `karar-${selected.case_number?.replace(/\//g, "-") ?? "indirilen"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadUDF() {
    if (!selected) return;
    const kararContent = [
      `Mahkeme: ${selected.court}`,
      `Esas No: ${selected.case_number}`,
      `Konu: ${selected.subject}`,
      content || selected.summary || "",
    ].join("\n\n");
    try {
      const res = await fetch("/api/buro/uyap/udf-hazirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "karar", content: kararContent }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karar-${selected.case_number?.replace(/\//g, "-") ?? "indirilen"}.udf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }

  async function downloadWord() {
    if (!selected) return;
    const kararContent = [
      `Mahkeme: ${selected.court}`,
      `Esas No: ${selected.case_number}`,
      `Konu: ${selected.subject}`,
      "",
      content || selected.summary || "",
    ].join("\n\n");
    try {
      const res = await fetch("/api/buro/dilekce/export-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: kararContent, title: `Karar ${selected.case_number}` }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karar-${selected.case_number?.replace(/\//g, "-") ?? "indirilen"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }

  const sorted = sortResults(results, sort);

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-0">
      {/* Sol: Arama */}
      <div className={`${selected ? "lg:w-96 lg:flex-shrink-0" : "flex-1"} flex flex-col gap-4`}>
        {/* Arama formu */}
        <form onSubmit={handleSearch}>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Konu, mahkeme, esas numarası veya anahtar kelime..."
                className="input-field pl-10"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-5 whitespace-nowrap flex-shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ara"}
            </button>
          </div>

          {/* Filtreler */}
          <div className="flex flex-wrap gap-2 mb-2">
            <select value={court} onChange={(e) => setCourt(e.target.value)} className="input-field text-sm py-1.5 w-auto">
              {COURTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field text-sm py-1.5 w-auto">
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field text-xs py-1.5 w-36"
                placeholder="Başlangıç"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field text-xs py-1.5 w-36"
                placeholder="Bitiş"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => { setQuery(term); doSearch(term, court, 1); }}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors font-body"
              >
                {term}
              </button>
            ))}
          </div>
        </form>

        {/* Kaynak göstergesi */}
        {searched && !loading && source && (
          <div className="flex items-center gap-1.5">
            <Zap className={`w-3.5 h-3.5 ${source === "live" ? "text-green-500" : source === "cache" ? "text-blue-400" : "text-muted-foreground"}`} />
            <span className="font-body text-xs text-muted-foreground">
              {source === "live"  && `Bedesten'den canlı çekildi · ${total} karar`}
              {source === "cache" && `Önbellekten · ${total} karar`}
              {source === "db"    && `Yerel veritabanından · ${sorted.length} karar`}
            </span>
          </div>
        )}

        {/* Yükleniyor */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 mb-3" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Sonuçlar */}
        {!loading && sorted.length > 0 && (
          <div className="space-y-3">
            {sorted.map((c) => {
              const id = getId(c);
              const isSelected = selected && getId(selected) === id;
              const dateStr = c.decision_date
                ? new Date(c.decision_date).toLocaleDateString("tr-TR")
                : "";

              return (
                <div
                  key={id}
                  onClick={() => selectKarar(c)}
                  className={`card hover:shadow-elevated transition-shadow cursor-pointer ${isSelected ? "border-accent shadow-elevated" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-body font-medium ${getCourtColor(c.court)}`}>
                          {c.court}
                        </span>
                        {c.case_number && <span className="legal-citation text-xs">{c.case_number}</span>}
                        {c.decision_number && <span className="legal-citation text-xs">K.{c.decision_number}</span>}
                      </div>
                      <h3 className="font-heading text-sm font-bold text-primary mb-1">{c.subject}</h3>
                      <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-2">{c.summary}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {dateStr && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); selectKarar(c); }}
                        className="text-accent hover:text-accent/80 text-xs font-body font-medium flex items-center gap-0.5"
                      >
                        İncele
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sayfalama */}
        {!loading && total > 10 && sorted.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={() => doSearch(query, court, page - 1)} disabled={page === 1}
              className="btn-outline px-4 py-2 text-sm disabled:opacity-40">← Önceki</button>
            <span className="font-body text-sm text-muted-foreground">Sayfa {page} / {Math.ceil(total / 10)}</span>
            <button onClick={() => doSearch(query, court, page + 1)} disabled={page >= Math.ceil(total / 10)}
              className="btn-outline px-4 py-2 text-sm disabled:opacity-40">Sonraki →</button>
          </div>
        )}

        {!loading && searched && sorted.length === 0 && (
          <div className="text-center py-12">
            <Scale className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="font-heading text-lg text-primary mb-1">Sonuç bulunamadı</p>
            <p className="font-body text-sm text-muted-foreground">Farklı anahtar kelimeler deneyin.</p>
          </div>
        )}

        {!loading && !searched && sorted.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">Aramak istediğiniz konuyu girin.</p>
          </div>
        )}
      </div>

      {/* Sağ panel: Karar detayı */}
      {selected && (
        <div className="flex-1 border border-border rounded-xl overflow-hidden flex flex-col bg-background">
          {/* Panel başlık */}
          <div className="border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <button onClick={() => { setSelected(null); setContent(null); setOzetText(""); }}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-sm font-bold text-primary truncate">{selected.subject}</h2>
              <p className="text-xs text-muted-foreground">
                {selected.court}
                {selected.case_number && ` · ${selected.case_number}`}
                {selected.decision_date && ` · ${new Date(selected.decision_date).toLocaleDateString("tr-TR")}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={downloadPDF}
                className="flex items-center gap-1 text-xs font-body font-semibold px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                <Download className="w-3 h-3" /> PDF
              </button>
              <button onClick={downloadUDF}
                className="flex items-center gap-1 text-xs font-body font-semibold px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                <FileText className="w-3 h-3" /> UDF
              </button>
              <button onClick={downloadWord}
                className="flex items-center gap-1 text-xs font-body font-semibold px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                <FileText className="w-3 h-3" /> Word
              </button>
              {selected.source_url && (
                <a href={selected.source_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-body font-semibold px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                  <ExternalLink className="w-3 h-3" /> Kaynak
                </a>
              )}
            </div>
          </div>

          {/* Sekmeler */}
          <div className="border-b border-border px-4 flex gap-1 flex-shrink-0">
            {(["metin", "ozet"] as const).map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (tab === "ozet" && !ozetText && !ozetLoading) generateOzet(); }}
                className={`px-4 py-3 text-xs font-body font-semibold border-b-2 transition-colors ${activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {tab === "metin" ? "Karar Metni" : "AI Özet"}
              </button>
            ))}
          </div>

          {/* Panel içerik */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "metin" && (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Mahkeme", value: selected.court },
                    { label: "Esas No", value: selected.case_number },
                    { label: "Karar No", value: selected.decision_number ?? "-" },
                    { label: "Tarih", value: selected.decision_date ? new Date(selected.decision_date).toLocaleDateString("tr-TR") : "-" },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/40 rounded-lg p-3">
                      <p className="font-body text-xs text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-body text-xs font-semibold text-primary">{f.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <h3 className="font-body text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Özet
                  </h3>
                  <p className="font-body text-sm text-foreground leading-relaxed">{selected.summary}</p>
                </div>
                <div>
                  <h3 className="font-body text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Tam Metin
                  </h3>
                  {contentLoading ? (
                    <div className="flex items-center gap-2 py-8 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="font-body text-sm">Karar metni yükleniyor...</span>
                    </div>
                  ) : content ? (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <pre className="font-body text-xs text-foreground leading-relaxed whitespace-pre-wrap">{content}</pre>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="font-body text-sm text-muted-foreground">Tam metin bu karar için mevcut değil.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "ozet" && (
              <div>
                {ozetLoading && !ozetText && (
                  <div className="flex items-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-body text-sm">Özet oluşturuluyor...</span>
                  </div>
                )}
                {ozetText && (
                  <div className="bg-muted/20 rounded-xl p-4 border border-border">
                    <MarkdownRenderer content={ozetText} />
                    {ozetLoading && <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5 align-middle" />}
                  </div>
                )}
                {!ozetLoading && !ozetText && (
                  <div className="text-center py-8">
                    <button onClick={generateOzet}
                      className="btn-primary flex items-center gap-2 mx-auto">
                      Özet Oluştur
                    </button>
                    <p className="font-body text-xs text-muted-foreground mt-2">AI bu kararı hukuki açıdan analiz edecek</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
