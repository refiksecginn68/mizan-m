"use client";

import { useState } from "react";
import { Search, Scale, Calendar, Building2, FileText, ChevronRight, ExternalLink, Loader2, Zap } from "lucide-react";

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

export default function EmsalSearch({ initialResults = [] }: EmsalSearchProps) {
  const [query, setQuery]     = useState("");
  const [court, setCourt]     = useState("all");
  const [results, setResults] = useState<CaseLaw[]>(initialResults);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [source, setSource]   = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<Record<string, string>>({});
  const [docLoading, setDocLoading] = useState<string | null>(null);

  async function doSearch(q: string, c: string, p: number) {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q, court: c, page: String(p) });
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

  async function loadDocument(docId: string) {
    if (docContent[docId]) {
      setExpanded(expanded === docId ? null : docId);
      return;
    }
    setDocLoading(docId);
    try {
      const res = await fetch(`/api/emsal/document/${encodeURIComponent(docId)}`);
      const data = await res.json() as { content: string };
      if (data.content) {
        setDocContent((prev) => ({ ...prev, [docId]: data.content }));
      }
    } catch { /* ignore */ }
    setDocLoading(null);
    setExpanded(docId);
  }

  function getId(item: CaseLaw) {
    return item.documentId || item.id || "";
  }

  return (
    <div>
      {/* Arama formu */}
      <form onSubmit={handleSearch} className="mb-5">
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
          <select
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            className="input-field w-36 flex-shrink-0"
          >
            {COURTS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button type="submit" disabled={loading} className="btn-primary px-5 whitespace-nowrap flex-shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ara"}
          </button>
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
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className={`w-3.5 h-3.5 ${source === "live" ? "text-green-500" : source === "cache" ? "text-blue-400" : "text-muted-foreground"}`} />
          <span className="font-body text-xs text-muted-foreground">
            {source === "live"  && `Bedesten'den canlı çekildi · ${total} karar`}
            {source === "cache" && `Önbellekten · ${total} karar`}
            {source === "db"    && `Yerel veritabanından · ${results.length} karar`}
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
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((c) => {
            const id = getId(c);
            const isExpanded = expanded === id;
            const dateStr = c.decision_date
              ? new Date(c.decision_date).toLocaleDateString("tr-TR")
              : "";

            return (
              <div key={id} className="card hover:shadow-elevated transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-body font-medium ${getCourtColor(c.court)}`}>
                        {c.court}
                      </span>
                      {c.case_number && (
                        <span className="legal-citation text-xs">{c.case_number}</span>
                      )}
                      {c.decision_number && (
                        <span className="legal-citation text-xs">K.{c.decision_number}</span>
                      )}
                    </div>
                    <h3 className="font-heading text-sm font-bold text-primary mb-1">{c.subject}</h3>
                    <p className={`font-body text-sm text-muted-foreground leading-relaxed ${!isExpanded ? "line-clamp-2" : ""}`}>
                      {c.summary}
                    </p>

                    {/* Tam metin içeriği */}
                    {isExpanded && docContent[id] && (
                      <div className="mt-3 p-3 bg-muted/40 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="font-body text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                          {docContent[id]}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {dateStr && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {c.source_url && (
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-accent transition-colors p-1"
                          title="Kaynağa git"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {id && (
                        <button
                          onClick={() => loadDocument(id)}
                          disabled={docLoading === id}
                          className="text-accent hover:text-accent/80 text-xs font-body font-medium flex items-center gap-0.5 transition-colors"
                        >
                          {docLoading === id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              {isExpanded ? "Kapat" : "Tam Metin"}
                              <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {c.court}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {c.case_number}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama */}
      {!loading && total > 10 && results.length > 0 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => doSearch(query, court, page - 1)}
            disabled={page === 1}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
          >
            ← Önceki
          </button>
          <span className="font-body text-sm text-muted-foreground">
            Sayfa {page} / {Math.ceil(total / 10)}
          </span>
          <button
            onClick={() => doSearch(query, court, page + 1)}
            disabled={page >= Math.ceil(total / 10)}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
          >
            Sonraki →
          </button>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <Scale className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="font-heading text-lg text-primary mb-1">Sonuç bulunamadı</p>
          <p className="font-body text-sm text-muted-foreground">
            Farklı anahtar kelimeler deneyin.
          </p>
        </div>
      )}

      {!loading && !searched && results.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">
            Aramak istediğiniz konuyu girin.
          </p>
        </div>
      )}
    </div>
  );
}
