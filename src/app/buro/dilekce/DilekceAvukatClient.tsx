"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles, FileUp, BookOpen, Download, FileText,
  Loader2, Copy, Check, RefreshCw, Edit3,
  Clock, X, AlertCircle, Save, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Type, ChevronRight,
  FileCode2,
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
  initialKonu?: string;
  initialTur?: string;
}

export default function DilekceAvukatClient({ lawyerName, sablonar: initialSablonar, initialKonu = "", initialTur = "" }: Props) {
  const [tab, setTab] = useState<Tab>("ai");
  const [sablonar, setSablonar] = useState<Sablon[]>(initialSablonar);

  // AI formu
  const [konu, setKonu] = useState(initialKonu);
  const [tur] = useState(initialTur);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dosyaMetni, setDosyaMetni] = useState("");

  // Üretilen metin
  const [metin, setMetin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "word" | "udf" | null>(null);
  const [saved, setSaved] = useState(false);

  // Evrak yükleme
  const [evrakMetin, setEvrakMetin] = useState("");
  const [evrakFile, setEvrakFile] = useState<File | null>(null);

  // Formatting
  const [fontSize, setFontSize] = useState(14);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  const fileRef = useRef<HTMLInputElement>(null);
  const evrakRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstName = lawyerName.split(" ")[0];

  // MizanAI'dan gelen konu varsa otomatik generate
  useEffect(() => {
    if (initialKonu && !metin) {
      generate("ai");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UDF/PDF/DOCX ikili dosyalardır — file.text() çöp üretir; sunucuda çıkarılır
  const extractFileText = useCallback(async (file: File): Promise<{ text: string; warning?: string }> => {
    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    if (["udf", "pdf", "docx", "doc"].includes(ext)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/buro/dilekce/extract", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; warning?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Belge okunamadı");
      return { text: data.text ?? "", warning: data.warning };
    }
    return { text: await file.text().catch(() => "") };
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setError("");
    try {
      const { text, warning } = await extractFileText(file);
      setDosyaMetni(text.slice(0, 30000));
      if (warning) setError(warning);
    } catch (e) {
      setDosyaMetni("");
      setError(e instanceof Error ? e.message : "Belge okunamadı");
    }
  }, [extractFileText]);

  const handleEvrakUpload = useCallback(async (file: File) => {
    setEvrakFile(file);
    setError("");
    try {
      const { text, warning } = await extractFileText(file);
      setEvrakMetin(text.slice(0, 30000));
      if (warning) setError(warning);
    } catch (e) {
      setEvrakMetin("");
      setError(e instanceof Error ? e.message : "Belge okunamadı");
    }
  }, [extractFileText]);

  async function generate(mod: "ai" | "duzenle" = "ai") {
    if (!konu.trim() && mod === "ai") return;
    if (mod === "duzenle" && !metin) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError("");
    if (mod === "ai") setMetin("");

    try {
      const res = await fetch("/api/buro/dilekce/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konu: konu || "Düzenle",
          tur: tur || undefined,
          dosyaMetni: dosyaMetni || undefined,
          mod,
          mevcutMetin: mod === "duzenle" ? metin : undefined,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Hata oluştu");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6)) as { delta?: string; done?: boolean; error?: string };
            if (json.error) { setError(json.error); break; }
            if (json.delta) setMetin((m) => m + json.delta);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Bağlantı hatası");
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
    setMetin("");

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
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6)) as { delta?: string };
            if (json.delta) setMetin((m) => m + json.delta);
          } catch { /* ignore */ }
        }
      }
    } catch { setError("Bağlantı hatası"); }
    setLoading(false);
  }

  function copyText() {
    navigator.clipboard.writeText(metin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function insertFormat(prefix: string, suffix = prefix) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = metin.slice(start, end);
    const newText = metin.slice(0, start) + prefix + selected + suffix + metin.slice(end);
    setMetin(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  async function exportPDF() {
    setExporting("pdf");
    try {
      const res = await fetch("/api/buro/dilekce/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metin, baslik: konu }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dilekce.pdf";
        a.click();
        URL.revokeObjectURL(url);
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

  async function exportUDF() {
    setExporting("udf");
    try {
      const res = await fetch("/api/buro/dilekce/export-udf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metin, baslik: konu }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dilekce.udf";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setExporting(null);
  }

  async function saveAsTemplate() {
    if (!metin || !konu) return;
    try {
      await fetch("/api/buro/sablon/kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: konu, content: metin, document_type: "avukat_dilekce" }),
      });
      setSaved(true);
      setSablonar((prev) => [
        { id: Date.now().toString(), title: konu, document_type: "avukat_dilekce", content: metin, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
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
                  {tur && <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">{tur}</span>}
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-heading text-base font-bold text-white">MizanAI ile Dilekçe Oluştur</p>
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
                        <p className="text-[10px] text-gray-300 mt-0.5">UDF, PDF, DOCX, TXT</p>
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

                {loading && (
                  <button
                    onClick={() => abortRef.current?.abort()}
                    className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1"
                  >
                    Durdur
                  </button>
                )}
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
              ) : (
                <>
                  {/* Editör toolbar */}
                  <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    {/* Formatting */}
                    <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-0.5">
                      <button onClick={() => insertFormat("**")} title="Kalın"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => insertFormat("_")} title="İtalik"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Font size */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-0.5">
                      <Type className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="text-xs text-gray-600 border-none focus:outline-none bg-transparent"
                      >
                        {[10, 11, 12, 13, 14, 16, 18].map((s) => (
                          <option key={s} value={s}>{s}pt</option>
                        ))}
                      </select>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-0.5">
                      <button onClick={() => setTextAlign("left")}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${textAlign === "left" ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:bg-gray-100"}`}>
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setTextAlign("center")}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${textAlign === "center" ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:bg-gray-100"}`}>
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setTextAlign("right")}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${textAlign === "right" ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:bg-gray-100"}`}>
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <button onClick={copyText}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
                      {copied ? <><Check className="w-3 h-3 text-green-500" /> Kopyalandı</> : <><Copy className="w-3 h-3" /> Kopyala</>}
                    </button>
                    <button onClick={() => generate("duzenle")} disabled={loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors">
                      <RefreshCw className="w-3 h-3" /> Yeniden Üret
                    </button>
                    <button onClick={saveAsTemplate} disabled={!metin || saved}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors">
                      {saved ? <><Check className="w-3 h-3 text-green-500" /> Kaydedildi</> : <><Save className="w-3 h-3" /> Şablon Kaydet</>}
                    </button>

                    <div className="flex-1" />

                    {/* Export buttons */}
                    <button onClick={exportPDF} disabled={!!exporting || loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 transition-colors">
                      {exporting === "pdf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      PDF
                    </button>
                    <button onClick={exportWord} disabled={!!exporting || loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                      {exporting === "word" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                      Word
                    </button>
                    <button onClick={exportUDF} disabled={!!exporting || loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors">
                      {exporting === "udf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileCode2 className="w-3 h-3" />}
                      UDF (UYAP)
                    </button>
                  </div>

                  {/* Belge editörü */}
                  <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="h-1.5 bg-gradient-to-r from-[#1a2744] to-[#7c3aed]" />
                      <div className="p-10">
                        {loading && metin === "" ? (
                          <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                              <Loader2 className="w-10 h-10 text-[#7c3aed] animate-spin mx-auto mb-3" />
                              <p className="font-heading text-base font-bold text-[#0f1729]">Dilekçe hazırlanıyor...</p>
                              <p className="text-sm text-gray-400 mt-1">AI hukuki içeriği oluşturuyor</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            ref={textareaRef}
                            value={metin}
                            onChange={(e) => setMetin(e.target.value)}
                            className="w-full min-h-[600px] text-gray-800 leading-relaxed focus:outline-none resize-none"
                            style={{
                              fontFamily: "'Times New Roman', serif",
                              fontSize: `${fontSize}px`,
                              lineHeight: "1.8",
                              textAlign,
                            }}
                          />
                        )}
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
                  <p className="text-sm text-gray-400">Oluşturduğunuz dilekçeleri &quot;Şablon Kaydet&quot; ile buraya ekleyin</p>
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
