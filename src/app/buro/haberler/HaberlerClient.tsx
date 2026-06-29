"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ExternalLink, Sparkles, ChevronLeft, ChevronRight, Loader2, Tag } from "lucide-react";
import type { LegalNews } from "@/app/api/haberler/route";

const KATEGORILER = [
  "Tümü",
  "İş Hukuku",
  "Ceza Hukuku",
  "Medeni Hukuk",
  "Borçlar Hukuku",
  "İdare Hukuku",
  "Tüketici Hukuku",
  "Usul Hukuku",
  "Ticaret Hukuku",
  "Veri Koruma",
];

const KATEGORI_RENK: Record<string, string> = {
  "İş Hukuku": "bg-blue-100 text-blue-700 border-blue-200",
  "Ceza Hukuku": "bg-red-100 text-red-700 border-red-200",
  "Medeni Hukuk": "bg-purple-100 text-purple-700 border-purple-200",
  "Borçlar Hukuku": "bg-orange-100 text-orange-700 border-orange-200",
  "İdare Hukuku": "bg-green-100 text-green-700 border-green-200",
  "Tüketici Hukuku": "bg-teal-100 text-teal-700 border-teal-200",
  "Usul Hukuku": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Ticaret Hukuku": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Veri Koruma": "bg-rose-100 text-rose-700 border-rose-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function daysAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  return `${diff} gün önce`;
}

export default function HaberlerClient() {
  const [news, setNews] = useState<LegalNews[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Tümü");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounce arama
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(category !== "Tümü" && { category }),
        ...(debouncedQ && { q: debouncedQ }),
      });
      const res = await fetch(`/api/haberler?${params}`);
      const data = await res.json() as { news: LegalNews[]; total: number };
      setNews(data.news ?? []);
      setTotal(data.total ?? 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [category, debouncedQ, page]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const totalPages = Math.ceil(total / limit);
  const featured = news.filter((n) => n.is_featured);
  const regular = news.filter((n) => !n.is_featured);

  return (
    <div>
      {/* Arama + kategori */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Haber veya karar ara..."
              className="flex-1 text-sm bg-transparent text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {KATEGORILER.map((k) => (
            <button
              key={k}
              onClick={() => { setCategory(k); setPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all border ${
                category === k
                  ? "bg-[#1a2744] text-white border-[#1a2744]"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-heading text-base font-bold text-[#0f1729] mb-1">Sonuç bulunamadı</p>
          <p className="text-sm text-gray-400">Farklı bir arama terimi veya kategori deneyin.</p>
        </div>
      ) : (
        <>
          {/* Öne çıkan haberler */}
          {featured.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#c9a84c]" />
                <h2 className="font-heading text-sm font-bold text-[#0f1729]">Öne Çıkan</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((item) => (
                  <NewsCard key={item.id} item={item} featured />
                ))}
              </div>
            </div>
          )}

          {/* Normal haberler */}
          {regular.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {regular.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500 font-body">
                {page} / {totalPages} · <span className="text-gray-400">{total} haber</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NewsCard({ item, featured = false }: { item: LegalNews; featured?: boolean }) {
  const catStyle = KATEGORI_RENK[item.category] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className={`bg-white rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 group flex flex-col ${
      featured ? "border-[#c9a84c]/30 ring-1 ring-[#c9a84c]/20" : "border-gray-100"
    }`}>
      {featured && (
        <div className="h-1 bg-gradient-to-r from-[#c9a84c] to-[#e7b743] rounded-t-2xl" />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catStyle}`}>
            {item.category}
          </span>
          <span className="text-[10px] text-gray-400 ml-auto">{daysAgo(item.published_at)}</span>
        </div>

        <h3 className="font-heading text-sm font-bold text-[#0f1729] leading-snug mb-2 group-hover:text-[#1a2744] line-clamp-3">
          {item.title}
        </h3>

        {item.summary && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-3">
            {item.summary}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-3">
            <Tag className="w-3 h-3 text-gray-300 flex-shrink-0" />
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-gray-300" />
            <span className="text-[10px] text-gray-400">{item.source}</span>
          </div>
          <span className="text-[10px] text-gray-300">{formatDate(item.published_at)}</span>
        </div>
      </div>
    </div>
  );
}
