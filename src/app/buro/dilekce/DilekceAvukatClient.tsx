"use client";

import { useState, useRef, useCallback } from "react";
import {
  Sparkles, FileUp, BookOpen, Download, FileText,
  Loader2, Copy, Check, RefreshCw, Edit3, ChevronRight,
  Clock, X, AlertCircle,
} from "lucide-react";

type Tab = "ai" | "evrak" | "sablonar";

interface Sablon {
  id: string;
  title: string;
  document_type: string;
  content: string;
  created_at: string;
}

interface Props {
  lawyerName: string;
  sablonar: Sablon[];
}

export default function DilekceAvukatClient({ lawyerName, sablonar }: Props) {
  const [tab, setTab] = useState<Tab>("ai");

  // AI formu
  const [konu, setKonu] = useState("");
  const [ekBilgi] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dosyaMetni, setDosyaMetni] = useState("");

  // Üretilen metin
  const [metin, setMetin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "word" | null>(null);

  // Evrak yükleme
  const [evrakMetin, setEvrakMetin] = useState("");
  const [evrakFile, setEvrakFile] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const evrakRef = useRef<HTMLInputElement>(null);
  const firstName = lawyerName.split(" ")[0];

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    const text = await file.text().catch(() => "");
    setDosyaMetni(text.slice(0, 5000));
  }, []);

  const handleEvrakUpload = useCallback(async (file: File) => {
    setEvrakFile(file);
    const text = await file.text().catch(() => "");
    setEvrakMetin(text.slice(0, 10000));
  }, []);

  async function generate(mod: "ai" | "duzenle" = "ai") {
    if (!konu.trim() && mod === "ai") return;
    if (mod === "duzenle" && !metin) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buro/dilekce/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konu: konu || "Düzenle",
          ekBilgi,
          dosyaMetni,
          mod,
          mevcutMetin: mod === "duzenle" ? metin : undefined,
        }),
      });
      const data = await res.json() as { metin?: string; error?: string };
      if (!res.ok || data.error) { setError(data.error ?? "Hata oluştu"); return; }
      setMetin(data.metin ?? "");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  async function generateFromEvrak() {
    if (!evrakMetin) return;
    setKonu("Yüklenen belgeyi dilekçeye dönüştür");
    setDosyaMetni(evrakMetin);
    setTab("ai");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buro/dilekce/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konu: "Yüklenen belgeyi inceleyerek uygun dilekçeye dönüştür",
          dosyaMetni: evrakMetin,
          mod: "ai",
        }),
      });
      const data = await res.json() as { metin?: string; error?: string };
      if (data.metin) setMetin(data.metin);
      else setError(data.error ?? "Hata");
    } catch { setError("Bağlantı hatası"); }
    setLoading(false);
  }

  function copyText() {
    navigator.clipboard.writeText(metin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function exportPDF() {
    setExporting("pdf");
    try {
      const res = await fetch("/api/generate/dilekce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "avukat_dilekce_pdf", data: { icerik: metin, baslik: konu } }),
      });
      if (res.ok) {
        const data = await res.json() as { pdfUrl?: string };
        if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
      }
    } catch { /* ignore */ }
    setExporting(null);
  }

  async function exportWord() {
    setExporting("word");
    try {
      const res = await fetch("/api/buro/dilekce/export-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metin, baslik: konu }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dilekce.docx";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setExporting(null);
  }

  function loadSablon(s: Sablon) {
    setMetin(s.content);
    setKonu(s.title);
    setTab("ai");
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0f1729]">Dilekçe İşlemleri</h1>
            <p className="text-sm text-gray-400 mt-0.5">Av. {firstName} · AI destekli belge hazırlama</p>
          </div>
          <div className="flex items-center gap-1">
            {(["ai", "evrak", "sablonar"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  tab === t ? "bg-[#0f1729] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t === "ai" && "AI ile Oluştur"}
                {t === "evrak" && "Evrak Yükle & Düzenle"}
                {t === "sablonar" && `Şablonlarım (${sablonar.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-hidden flex">

        {/* AI SEKMESİ */}
        {tab === "ai" && (
          <>
            {/* Sol: Form */}
            <div className="w-96 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
              {/* Hero banner */}
              <div className="m-4 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">AI Destekli</span>
                  <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">Profesyonel</span>
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-heading text-base font-bold text-white">MizanAI ile Dilekçe Oluştur</p>
                  </div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Olay özetini yazın, emsal kararlarla desteklenmiş profesyonel dilekçe hazırlansın.
                </p>
              </div>

              {/* Form alanları */}
              <div className="px-4 pb-4 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Dilekçe Konusu <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={konu}
                    onChange={(e) => setKonu(e.target.value)}
                    placeholder="Dilekçe konusunu detaylı olarak anlatın...&#10;Örn: Müvekkilim 5 yıllık iş ilişkisinin ardından haksız yere feshedildi, kıdem tazminatı talep ediyoruz..."
                    rows={6}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#7c3aed] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Ek Dosya <span className="text-gray-300">(isteğe bağlı)</span>
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      uploadedFile ? "border-[#7c3aed]/40 bg-[#7c3aed]/5" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input ref={fileRef} type="file" className="hidden"
                      accept=".pdf,.docx,.txt,.udf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                    {uploadedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 text-[#7c3aed]" />
                        <span className="text-xs font-semibold text-[#7c3aed] truncate max-w-[180px]">{uploadedFile.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setDosyaMetni(""); }}
                          className="text-gray-400 hover:text-red-400 ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">Dosya Seç veya Sürükle</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">UDF, PDF, DOC formatı (DOCX)</p>
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  onClick={() => generate("ai")}
                  disabled={loading || !konu.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                    : <><Sparkles className="w-4 h-4" /> Dilekçe Oluşturmaya Başla</>
                  }
                </button>
              </div>
            </div>

            {/* Sağ: Editör */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#f4f5f7]">
              {!metin && !loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/10 flex items-center justify-center mx-auto mb-4">
                      <Edit3 className="w-8 h-8 text-[#7c3aed]/40" />
                    </div>
                    <p className="font-heading text-base font-bold text-[#0f1729] mb-1">Editör</p>
                    <p className="text-sm text-gray-400">Dilekçeyi oluşturduktan sonra burada düzenleyebilirsiniz</p>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#7c3aed] animate-spin mx-auto mb-3" />
                    <p className="font-heading text-base font-bold text-[#0f1729]">Dilekçe hazırlanıyor...</p>
                    <p className="text-sm text-gray-400 mt-1">AI hukuki içeriği oluşturuyor</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Editör toolbar */}
                  <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
                    <button onClick={copyText}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
                      {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Kopyalandı</> : <><Copy className="w-3.5 h-3.5" /> Kopyala</>}
                    </button>
                    <button onClick={() => generate("duzenle")} disabled={loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Yeniden Üret
                    </button>
                    <div className="flex-1" />
                    <button onClick={exportPDF} disabled={!!exporting}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#0f1729] hover:text-[#0f1729] transition-colors">
                      {exporting === "pdf" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      PDF İndir
                    </button>
                    <button onClick={exportWord} disabled={!!exporting}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors">
                      {exporting === "word" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      Word İndir
                    </button>
                  </div>

                  {/* Belge editörü */}
                  <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Kağıt başlık */}
                      <div className="h-1.5 bg-gradient-to-r from-[#1a2744] to-[#7c3aed]" />
                      <div className="p-10">
                        <textarea
                          value={metin}
                          onChange={(e) => setMetin(e.target.value)}
                          className="w-full min-h-[600px] text-sm text-gray-800 leading-relaxed focus:outline-none resize-none font-mono"
                          style={{ fontFamily: "'Times New Roman', serif", fontSize: "14px", lineHeight: "1.8" }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* EVRAK SEKMESİ */}
        {tab === "evrak" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-100 p-8">
                <h2 className="font-heading text-lg font-bold text-[#0f1729] mb-2">Evrak Yükle & Düzenle</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Mevcut bir belge, sözleşme veya dava dosyası yükleyin — AI bunu okuyarak uygun dilekçeyi hazırlasın.
                </p>

                <div
                  onClick={() => evrakRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    evrakFile ? "border-[#7c3aed]/40 bg-[#7c3aed]/5" : "border-gray-200 hover:border-[#7c3aed]/30"
                  }`}
                >
                  <input ref={evrakRef} type="file" className="hidden"
                    accept=".pdf,.docx,.txt,.udf,.doc"
                    onChange={(e) => e.target.files?.[0] && handleEvrakUpload(e.target.files[0])} />
                  <FileUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  {evrakFile ? (
                    <p className="text-sm font-semibold text-[#7c3aed]">{evrakFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-500">Dosya Seç veya Sürükle</p>
                      <p className="text-xs text-gray-300 mt-1">UDF, PDF, DOC, DOCX, TXT — max 20MB</p>
                    </>
                  )}
                </div>

                {evrakMetin && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Belgeden çıkarılan metin</label>
                    <textarea
                      value={evrakMetin}
                      onChange={(e) => setEvrakMetin(e.target.value)}
                      rows={8}
                      className="w-full text-xs text-gray-600 border border-gray-200 rounded-xl px-3 py-3 focus:outline-none resize-none font-mono"
                    />
                  </div>
                )}

                <button
                  onClick={generateFromEvrak}
                  disabled={!evrakMetin || loading}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> İşleniyor...</> : <><ChevronRight className="w-4 h-4" /> Dilekçeye Dönüştür</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ŞABLONLARIM SEKMESİ */}
        {tab === "sablonar" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              {sablonar.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="font-heading text-base font-bold text-[#0f1729] mb-1">Henüz şablon yok</p>
                  <p className="text-sm text-gray-400">Oluşturduğunuz dilekçeler burada listelenir</p>
                  <button onClick={() => setTab("ai")} className="mt-4 text-sm text-[#7c3aed] hover:underline font-semibold">
                    İlk dilekçeyi oluştur →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sablonar.map((s) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-sm font-bold text-[#0f1729] truncate">{s.title}</h3>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(s.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{s.content.slice(0, 180)}...</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => loadSablon(s)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors">
                            <Edit3 className="w-3.5 h-3.5" /> Düzenle
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
