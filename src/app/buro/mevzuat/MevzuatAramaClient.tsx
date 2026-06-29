"use client";

import { useState } from "react";
import {
  Search, Download, X, Sparkles, Loader2,
  ExternalLink, BookOpen, Filter, AlertCircle, Zap,
} from "lucide-react";

interface Mevzuat {
  id: string;
  mevzuatNo: string;
  mevzuatTur: string;
  adi: string;
  resmiGazeteSayisi?: string;
  resmiGazeteTarihi?: string;
  madde_sayisi?: number;
  ozet?: string;
}

type RightTab = "metin" | "ozet";

const TUR_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "kanun", label: "Kanun" },
  { value: "yonetmelik", label: "Yönetmelik" },
  { value: "khk", label: "KHK" },
  { value: "teblig", label: "Tebliğ" },
];

// Metin satır kaydırma (pdf-lib için)
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
      const w = font.widthOfTextAtSize(test, fontSize) as number;
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

export default function MevzuatAramaClient() {
  const [query, setQuery] = useState("");
  const [tur, setTur] = useState("all");
  const [results, setResults] = useState<Mevzuat[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Mevzuat | null>(null);
  const [maddeler, setMaddeler] = useState<string | null>(null);
  const [maddelerLoading, setMaddelerLoading] = useState(false);
  const [ozetText, setOzetText] = useState("");
  const [ozetLoading, setOzetLoading] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("metin");

  async function doSearch(q: string, t: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q, tur: t });
      const res = await fetch(`/api/mevzuat/search?${params}`);
      const data = (await res.json()) as { results: Mevzuat[]; total: number };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // Mevzuat seç + tam metin çekmeyi dene
  async function selectMevzuat(m: Mevzuat) {
    setSelected(m);
    setRightTab("metin");
    setMaddeler(null);
    setOzetText("");
    // Tam metin için mevzuat.gov.tr'den çekmeyi dene (proxy olmadığı için genellikle başarısız olur)
    setMaddelerLoading(true);
    try {
      const res = await fetch(
        `/api/mevzuat/metin?no=${encodeURIComponent(m.mevzuatNo)}&tur=${encodeURIComponent(m.mevzuatTur)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = (await res.json()) as { content?: string };
        setMaddeler(data.content ?? null);
      }
    } catch {
      // Tam metin çekilemedi — kullanıcıya mesaj göster
    } finally {
      setMaddelerLoading(false);
    }
  }

  // Panel kapat
  function closePanel() {
    setSelected(null);
    setMaddeler(null);
    setOzetText("");
    setRightTab("metin");
  }

  // PDF indirme
  async function downloadMevzuatPDF() {
    if (!selected) return;
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const margin = 50;
    const lineHeight = fontSize * 1.5;

    const text = [
      `${selected.adi}`,
      `Tür: ${selected.mevzuatTur} · No: ${selected.mevzuatNo}`,
      selected.resmiGazeteTarihi
        ? `Resmi Gazete: ${selected.resmiGazeteSayisi ?? ""} / ${new Date(selected.resmiGazeteTarihi).toLocaleDateString("tr-TR")}`
        : "",
      selected.madde_sayisi ? `Madde Sayısı: ${selected.madde_sayisi}` : "",
      "",
      selected.ozet ?? "",
      "",
      maddeler ?? "",
    ]
      .filter((l) => l !== undefined)
      .join("\n");

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
        currentPage.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }
      y -= lineHeight;
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mevzuat-${selected.mevzuatNo}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // AI Özet
  async function generateMevzuatOzet() {
    if (ozetLoading || !selected) return;
    setOzetLoading(true);
    setOzetText("");
    const context = [
      `${selected.mevzuatTur}: ${selected.adi} (No: ${selected.mevzuatNo})`,
      selected.resmiGazeteTarihi
        ? `Kabul Tarihi: ${new Date(selected.resmiGazeteTarihi).toLocaleDateString("tr-TR")}`
        : "",
      selected.ozet ?? "",
      maddeler?.slice(0, 3000) ?? "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Bu mevzuatı hukuki açıdan özetle ve temel düzenlemeleri açıkla:\n${context}`,
          mode: "avukat",
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let buf = "",
        full = "";
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
          } catch {
            /* devam et */
          }
        }
      }
    } catch {
      /* ignore */
    }
    setOzetLoading(false);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Başlık + Arama */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0f1729]">Mevzuat Arama</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                <BookOpen className="w-3 h-3" /> Kanun, Yönetmelik, KHK, Tebliğ
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-center">
            <div>
              <p className="font-heading text-lg font-bold text-[#0f1729]">90K+</p>
              <p className="text-[10px] text-gray-400">Mevzuat</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="font-heading text-lg font-bold text-[#0f1729]">Günlük</p>
              <p className="text-[10px] text-gray-400">Güncelleme</p>
            </div>
          </div>
        </div>

        {/* Arama kutusu */}
        <div className="bg-[#f9f9f9] border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch(query, tur)}
              placeholder="Kanun adı, numara veya konu yazın..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              onClick={() => doSearch(query, tur)}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e7b743] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" /> Ara
                </>
              )}
            </button>
          </div>

          {/* Tür filtresi */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            {TUR_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTur(t.value);
                  if (searched) doSearch(query, t.value);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tur === t.value
                    ? "bg-[#c9a84c] text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ana içerik */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sol: Sonuç listesi */}
        <div
          className={`${
            selected ? "w-96 flex-shrink-0 border-r border-gray-200" : "flex-1"
          } bg-[#f8f9fa] flex flex-col overflow-hidden transition-all`}
        >
          <div className="flex-1 overflow-y-auto p-4">
            {/* Yükleniyor */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
                  >
                    <div className="h-4 w-20 bg-gray-100 rounded-full mb-2" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Sonuç kartları */}
            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => selectMevzuat(m)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-[#c9a84c] transition-all ${
                      selected?.id === m.id
                        ? "border-[#c9a84c] bg-[#c9a84c]/5"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1a2744]/10 text-[#1a2744]">
                        {m.mevzuatTur}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">No: {m.mevzuatNo}</span>
                    </div>
                    <h3 className="font-heading text-sm font-bold text-[#0f1729] mb-1">{m.adi}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{m.ozet}</p>
                    {m.madde_sayisi && (
                      <p className="text-[10px] text-gray-400 mt-1.5">{m.madde_sayisi} madde</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Boş durum */}
            {!loading && !searched && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-[#c9a84c]" />
                </div>
                <p className="font-heading text-base font-bold text-[#0f1729] mb-1">
                  Mevzuat Arayın
                </p>
                <p className="text-sm text-gray-400">
                  Türk hukuku mevzuatında arama yapın
                </p>
              </div>
            )}

            {!loading && searched && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
                <p className="font-heading text-base font-bold text-[#0f1729] mb-1">
                  Sonuç bulunamadı
                </p>
                <p className="text-sm text-gray-400">Farklı anahtar kelimeler deneyin</p>
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Mevzuat detay paneli */}
        {selected && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Panel başlık */}
            <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={closePanel}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-sm font-bold text-[#0f1729] truncate">
                  {selected.adi}
                </h2>
                <p className="text-xs text-gray-400">
                  {selected.mevzuatTur} · No: {selected.mevzuatNo}
                  {selected.resmiGazeteTarihi &&
                    ` · RG: ${new Date(selected.resmiGazeteTarihi).toLocaleDateString("tr-TR")}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={downloadMevzuatPDF}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
                <a
                  href={`https://mevzuat.gov.tr/mevzuat?MevzuatNo=${selected.mevzuatNo}&MevzuatTur=${selected.mevzuatTur}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Kaynak
                </a>
                <button
                  onClick={() => {
                    generateMevzuatOzet();
                    setRightTab("ozet");
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e7b743] text-white"
                >
                  <Sparkles className="w-3 h-3" /> AI Özet
                </button>
              </div>
            </div>

            {/* Sekme çubuğu */}
            <div className="border-b border-gray-100 px-5 flex gap-1 flex-shrink-0 bg-white">
              {(["metin", "ozet"] as RightTab[]).map((tab) => {
                const labels: Record<RightTab, string> = {
                  metin: "Genel Bilgi",
                  ozet: "AI Özet",
                };
                const icons: Record<RightTab, React.ElementType> = {
                  metin: BookOpen,
                  ozet: Sparkles,
                };
                const Icon = icons[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setRightTab(tab);
                      if (tab === "ozet" && !ozetText && !ozetLoading) {
                        generateMevzuatOzet();
                      }
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
            <div className="flex-1 overflow-y-auto p-6">
              {/* Genel Bilgi sekmesi */}
              {rightTab === "metin" && (
                <div>
                  {/* Mevzuat bilgileri grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { label: "Tür", value: selected.mevzuatTur },
                      { label: "Numara", value: selected.mevzuatNo },
                      {
                        label: "RG Sayısı",
                        value: selected.resmiGazeteSayisi ?? "-",
                      },
                      {
                        label: "Kabul Tarihi",
                        value: selected.resmiGazeteTarihi
                          ? new Date(selected.resmiGazeteTarihi).toLocaleDateString("tr-TR")
                          : "-",
                      },
                      ...(selected.madde_sayisi
                        ? [
                            {
                              label: "Madde Sayısı",
                              value: `${selected.madde_sayisi} madde`,
                            },
                          ]
                        : []),
                    ].map((field) => (
                      <div key={field.label} className="bg-[#f8f9fa] rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 mb-0.5">{field.label}</p>
                        <p className="text-xs font-semibold text-[#0f1729]">{field.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Özet */}
                  {selected.ozet && (
                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        Kapsam
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{selected.ozet}</p>
                    </div>
                  )}

                  {/* Tam metin */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Tam Metin
                    </h3>
                    {maddelerLoading ? (
                      <div className="flex items-center gap-2 py-8 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Mevzuat metni yükleniyor...</span>
                      </div>
                    ) : maddeler ? (
                      <div className="bg-[#f8f9fa] rounded-xl p-4">
                        <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                          {maddeler}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-[#f8f9fa] rounded-xl p-5 text-center">
                        <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Tam metin görüntülemek için resmi kaynağı ziyaret edin
                        </p>
                        <a
                          href={`https://mevzuat.gov.tr/mevzuat?MevzuatNo=${selected.mevzuatNo}&MevzuatTur=${selected.mevzuatTur}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#c9a84c] hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" /> mevzuat.gov.tr&apos;de Görüntüle
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Özet sekmesi */}
              {rightTab === "ozet" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      AI Hukuki Özet
                    </h3>
                    {!ozetLoading && ozetText && (
                      <button
                        onClick={generateMevzuatOzet}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                      >
                        <Zap className="w-3 h-3" /> Yenile
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
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {ozetText}
                      </p>
                      {ozetLoading && (
                        <span className="inline-block w-1.5 h-4 bg-purple-400 animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                  )}

                  {!ozetLoading && !ozetText && (
                    <div className="text-center py-8">
                      <button
                        onClick={generateMevzuatOzet}
                        className="flex items-center gap-2 mx-auto bg-gradient-to-r from-[#c9a84c] to-[#e7b743] text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
                      >
                        <Sparkles className="w-4 h-4" /> Özet Oluştur
                      </button>
                      <p className="text-xs text-gray-400 mt-2">
                        AI bu mevzuatı hukuki açıdan analiz edecek
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
