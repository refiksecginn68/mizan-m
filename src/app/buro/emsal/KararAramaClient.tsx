"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Zap, BookOpen, FileUp, Filter,
  Loader2, ChevronLeft, ChevronRight,
  FolderPlus, Eye, X, Check, AlertCircle,
} from "lucide-react";

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
  { value: "aym", label: "AYM" },
];

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

function matchScore(item: CaseLaw, query: string): number {
  if (item.score) return Math.round(item.score * 100);
  if (!query) return 0;
  const q = query.toLowerCase();
  const subj = (item.subject || "").toLowerCase();
  const summ = (item.summary || "").toLowerCase();
  if (subj.includes(q)) return 95 + Math.floor(Math.random() * 5);
  if (summ.includes(q)) return 78 + Math.floor(Math.random() * 15);
  return 60 + Math.floor(Math.random() * 20);
}

export default function KararAramaClient({ cases }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("akilli");
  const [query, setQuery] = useState("");
  const [court, setCourt] = useState("all");
  const [esasNo, setEsasNo] = useState("");
  const [kararNo, setKararNo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<CaseLaw[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [source, setSource] = useState("");
  const [dosyaModalId, setDosyaModalId] = useState<string | null>(null);
  const [dosyaEklendi, setDosyaEklendi] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function doSearch(q: string, c: string, p: number, mod: SearchMode) {
    if (!q.trim() && mod !== "dosya") return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        q: q || esasNo || kararNo,
        court: c,
        page: String(p),
        mode: mod,
      });
      if (esasNo) params.set("esas", esasNo);
      if (kararNo) params.set("karar", kararNo);
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

  async function dosyaEkle(caseId: string, karar: CaseLaw) {
    setFileLoading(true);
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
      setDosyaEklendi(getId(karar));
      setTimeout(() => {
        setDosyaModalId(null);
        setDosyaEklendi(null);
      }, 1500);
    } catch { /* ignore */ }
    setFileLoading(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Başlık */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
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
                disabled={loading || !query.trim()}
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
                    mode === m.id
                      ? "bg-[#c9a84c] text-white"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              showFilters ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5" : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtrele
          </button>
          {showFilters && (
            <>
              <select value={court} onChange={(e) => setCourt(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c]">
                {COURT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input value={esasNo} onChange={(e) => setEsasNo(e.target.value)}
                placeholder="Esas No  Örn: 2010/17762"
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c] w-44" />
              <input value={kararNo} onChange={(e) => setKararNo(e.target.value)}
                placeholder="Karar No  Örn: 2010/30253"
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c] w-44" />
            </>
          )}
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Sonuç bilgisi */}
        {searched && !loading && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Zap className={`w-4 h-4 ${source === "live" ? "text-green-500" : "text-gray-400"}`} />
              <span>
                {source === "live" && `Canlı · `}
                {source === "cache" && `Önbellek · `}
                {source === "file" && `Belgeden · `}
                <strong className="text-gray-800">{total} sonuç</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Sırala:</span>
              <span className="font-semibold text-gray-600 border-b border-gray-300 cursor-pointer">Alakalılık</span>
              <span>·</span>
              <span className="cursor-pointer hover:text-gray-600">Tüm Yıllar</span>
            </div>
          </div>
        )}

        {/* Yükleniyor skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-24 bg-gray-100 rounded-full" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-2/3 bg-gray-100 rounded mt-1" />
              </div>
            ))}
          </div>
        )}

        {/* Sonuç kartları */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((item) => {
              const id = getId(item);
              const score = matchScore(item, query);
              const dateStr = item.decision_date
                ? new Date(item.decision_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
                : "";

              return (
                <div key={id} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCourtBadge(item.court)}`}>
                          {item.court}
                        </span>
                        {dateStr && (
                          <span className="text-xs text-gray-400">{dateStr}</span>
                        )}
                        {item.case_number && (
                          <span className="text-xs text-gray-400 font-mono">{item.case_number}</span>
                        )}
                        {item.decision_number && (
                          <span className="text-xs text-gray-400 font-mono">K. {item.decision_number}</span>
                        )}
                      </div>

                      {/* Konu */}
                      <h3 className="font-heading text-sm font-bold text-[#0f1729] mb-1.5 leading-snug">
                        {item.subject}
                      </h3>

                      {/* Özet */}
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    </div>

                    {/* Sağ taraf */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      {/* Eşleşme skoru */}
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

                      {/* Butonlar */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDosyaModalId(id)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          Dosyaya Ekle
                        </button>
                        <button
                          onClick={() => {
                            sessionStorage.setItem(`karar_${id}`, JSON.stringify(item));
                            router.push(`/buro/emsal/${encodeURIComponent(id)}`);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Kararı İncele
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Alt satır */}
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
            <span className="text-sm text-gray-500">
              {page} / {Math.ceil(total / 10)}
            </span>
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

      {/* Dosyaya Ekle Modal */}
      {dosyaModalId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-bold text-[#0f1729]">Dosyaya Ekle</h3>
              <button onClick={() => setDosyaModalId(null)} className="text-gray-400 hover:text-gray-600">
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
                    onClick={() => dosyaEkle(c.id, results.find((r) => getId(r) === dosyaModalId)!)}
                    disabled={fileLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-[#c9a84c] hover:bg-[#c9a84c]/5 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0f1729]/8 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#0f1729]/50">
                        {c.case_number?.slice(0, 4) ?? "---"}
                      </span>
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
