"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles, FileUp, BookOpen, Download, FileText,
  Loader2, Copy, Check, RefreshCw, Edit3,
  Clock, X, AlertCircle, Save, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, ChevronRight,
  FileCode2, Star, Trash2, List, ListOrdered, Palette,
  Undo2, Redo2,
} from "lucide-react";

import { DILEKCE_SABLONLARI, SABLON_KATEGORILERI, type DilekceSablonu } from "@/lib/data/dilekce-sablonlari";

type Tab = "ai" | "evrak" | "sablonar" | "ornekler";

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
  initialFavoriler?: string[];
  initialKonu?: string;
  initialTur?: string;
}

export default function DilekceAvukatClient({ lawyerName, sablonar: initialSablonar, initialFavoriler = [], initialKonu = "", initialTur = "" }: Props) {
  const [tab, setTab] = useState<Tab>("ai");
  const [sablonar, setSablonar] = useState<Sablon[]>(initialSablonar);
  const [favoriler, setFavoriler] = useState<string[]>(initialFavoriler);

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
  const [fontFamily, setFontFamily] = useState("'Times New Roman', serif");
  const [renkPaletiAcik, setRenkPaletiAcik] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const evrakRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorSyncRef = useRef(false);
  const firstName = lawyerName.split(" ")[0];

  // Dış kaynaklı metin değişimini (AI stream, şablon yükleme) editör DOM'una yaz.
  // Kullanıcı yazarken (editorSyncRef) geri yazma yapılmaz — imleç zıplamasın.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (editorSyncRef.current) { editorSyncRef.current = false; return; }
    if (el.innerText !== metin) el.innerText = metin;
  });

  function handleEditorInput() {
    const el = editorRef.current;
    if (!el) return;
    editorSyncRef.current = true;
    setMetin(el.innerText);
  }

  // Zengin metin komutu: seçime uygular, metin state'ini senkron tutar
  function exec(cmd: string, value?: string) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, value);
    editorSyncRef.current = true;
    setMetin(el.innerText);
  }

  const RENK_PALETI = [
    "#000000", "#374151", "#6b7280", "#9ca3af",
    "#7f1d1d", "#dc2626", "#ea580c", "#d97706",
    "#166534", "#16a34a", "#0d9488", "#0284c7",
    "#1e3a8a", "#2563eb", "#7c3aed", "#a21caf",
    "#c9a84c", "#92400e", "#e11d48", "#ffffff",
  ];

  const FONTLAR = [
    { value: "'Times New Roman', serif", label: "Times New Roman" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Calibri, sans-serif", label: "Calibri" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "'Courier New', monospace", label: "Courier New" },
  ];

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
      const res = await fetch("/api/buro/sablon/kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: konu, content: metin, document_type: "avukat_sablon" }),
      });
      const data = await res.json() as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok) { setError(data.error ?? "Şablon kaydedilemedi"); return; }
      setSaved(true);
      setSablonar((prev) => [
        { id: data.id ?? Date.now().toString(), title: konu, document_type: "avukat_sablon", content: metin, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setTimeout(() => setSaved(false), 2500);
    } catch { setError("Şablon kaydedilemedi"); }
  }

  async function deleteSablon(id: string) {
    const onceki = sablonar;
    setSablonar((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/buro/sablon/kaydet?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) setSablonar(onceki);
    } catch { setSablonar(onceki); }
  }

  function loadSablon(s: Sablon) {
    setMetin(s.content);
    setKonu(s.title);
    setTab("ai");
  }

  // ── Favori örnek şablonlar ──
  async function toggleFavori(sablonId: string) {
    const favoriMi = favoriler.includes(sablonId);
    setFavoriler((prev) => (favoriMi ? prev.filter((f) => f !== sablonId) : [...prev, sablonId]));
    try {
      const res = favoriMi
        ? await fetch(`/api/buro/dilekce/favori?sablon_id=${encodeURIComponent(sablonId)}`, { method: "DELETE" })
        : await fetch("/api/buro/dilekce/favori", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sablon_id: sablonId }),
          });
      if (!res.ok) setFavoriler((prev) => (favoriMi ? [...prev, sablonId] : prev.filter((f) => f !== sablonId)));
    } catch {
      setFavoriler((prev) => (favoriMi ? [...prev, sablonId] : prev.filter((f) => f !== sablonId)));
    }
  }

  // ── Örnek şablonlar (hazır kütüphane) ──
  const [ornekArama, setOrnekArama] = useState("");
  const [ornekKategori, setOrnekKategori] = useState("");
  const [ornekIndiriliyor, setOrnekIndiriliyor] = useState("");
  const [sadeceFavoriler, setSadeceFavoriler] = useState(false);

  const filtreliOrnekler = DILEKCE_SABLONLARI.filter((s) => {
    if (sadeceFavoriler && !favoriler.includes(s.id)) return false;
    if (ornekKategori && s.kategori !== ornekKategori) return false;
    if (ornekArama.trim()) {
      const q = ornekArama.toLowerCase();
      return `${s.baslik} ${s.kategori} ${s.aciklama}`.toLowerCase().includes(q);
    }
    return true;
  });

  function ornekEditordeAc(s: DilekceSablonu) {
    setMetin(s.icerik);
    setKonu(s.baslik);
    setTab("ai");
  }

  // Şablonu editöre yüklemeden doğrudan indir (mevcut export uçlarını kullanır)
  async function ornekIndir(s: DilekceSablonu, format: "pdf" | "word" | "udf") {
    setOrnekIndiriliyor(`${s.id}-${format}`);
    try {
      const res = await fetch(`/api/buro/dilekce/export-${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metin: s.icerik, baslik: s.baslik }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${s.id}.${format === "word" ? "docx" : format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setOrnekIndiriliyor("");
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
            {(["ai", "evrak", "ornekler", "sablonar"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  tab === t ? "bg-[#0f1729] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t === "ai" && "AI ile Oluştur"}
                {t === "evrak" && "Evrak Yükle & Düzenle"}
                {t === "ornekler" && `Örnek Şablonlar (${DILEKCE_SABLONLARI.length})`}
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
                  {/* Editör toolbar — tüm düğmeler seçili metne gerçekten uygulanır */}
                  <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    {/* Geri al / Yinele */}
                    <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-0.5">
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("undo")} title="Geri Al"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("redo")} title="Yinele"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <Redo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Font ailesi */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-0.5">
                      <select
                        value={fontFamily}
                        onChange={(e) => { setFontFamily(e.target.value); exec("fontName", e.target.value); }}
                        title="Yazı Tipi"
                        className="text-xs text-gray-600 border-none focus:outline-none bg-transparent max-w-[130px]"
                      >
                        {FONTLAR.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Punto: seçim + büyüt/küçült */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-0.5">
                      <Type className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        title="Punto"
                        className="text-xs text-gray-600 border-none focus:outline-none bg-transparent"
                      >
                        {[10, 11, 12, 13, 14, 16, 18, 20, 24].map((s) => (
                          <option key={s} value={s}>{s}pt</option>
                        ))}
                      </select>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => setFontSize((f) => Math.min(f + 1, 32))} title="Punto Büyüt"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-xs font-bold">
                        A+
                      </button>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => setFontSize((f) => Math.max(f - 1, 8))} title="Punto Küçült"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-[10px] font-bold">
                        A−
                      </button>
                    </div>

                    {/* Kalın / İtalik / Altı çizili */}
                    <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-0.5">
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} title="Kalın"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} title="İtalik"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} title="Altı Çizili"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Renk paleti */}
                    <div className="relative flex items-center border-r border-gray-200 pr-2 mr-0.5">
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => setRenkPaletiAcik(!renkPaletiAcik)} title="Yazı Rengi"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <Palette className="w-3.5 h-3.5" />
                      </button>
                      {renkPaletiAcik && (
                        <div className="absolute top-9 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-5 gap-1 w-40">
                          {RENK_PALETI.map((renk) => (
                            <button
                              key={renk}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { exec("foreColor", renk); setRenkPaletiAcik(false); }}
                              title={renk}
                              className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                              style={{ backgroundColor: renk }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hizalama */}
                    <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-0.5">
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyLeft")} title="Sola Hizala"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyCenter")} title="Ortala"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyRight")} title="Sağa Hizala"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyFull")} title="İki Yana Yasla"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <AlignJustify className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Listeler */}
                    <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-0.5">
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} title="Madde İşaretli Liste"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} title="Numaralı Liste"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <ListOrdered className="w-3.5 h-3.5" />
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
                          <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleEditorInput}
                            spellCheck={false}
                            className="w-full min-h-[600px] text-gray-800 leading-relaxed focus:outline-none whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                            style={{
                              fontFamily,
                              fontSize: `${fontSize}px`,
                              lineHeight: "1.8",
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
                          <button onClick={() => deleteSablon(s.id)} title="Şablonu sil"
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Sil
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

        {/* ÖRNEK ŞABLONLAR SEKMESİ */}
        {tab === "ornekler" && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="mb-5">
                <h2 className="font-heading text-lg font-bold text-[#0f1729]">Örnek Dilekçe Şablonları</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Özgün olarak hazırlanmış, [köşeli parantezli] yer tutucular içeren standart iskeletler.
                  Editörde açıp doldurun veya doğrudan indirin.
                </p>
              </div>

              {/* Arama + kategori filtresi */}
              <div className="flex flex-col gap-3 mb-5">
                <input
                  value={ornekArama}
                  onChange={(e) => setOrnekArama(e.target.value)}
                  placeholder="Şablon ara... (ör. kıdem, boşanma, itiraz)"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#c9a84c]"
                />
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSadeceFavoriler(!sadeceFavoriler)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sadeceFavoriler ? "bg-[#c9a84c] text-white" : "bg-[#c9a84c]/10 text-[#c9a84c] hover:bg-[#c9a84c]/20"
                    }`}
                  >
                    <Star className={`w-3 h-3 ${sadeceFavoriler ? "fill-white" : "fill-[#c9a84c]"}`} />
                    Favori Dilekçeler ({favoriler.length})
                  </button>
                  <button
                    onClick={() => setOrnekKategori("")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      ornekKategori === "" ? "bg-[#0f1729] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    Tümü
                  </button>
                  {SABLON_KATEGORILERI.map((k) => (
                    <button
                      key={k}
                      onClick={() => setOrnekKategori(ornekKategori === k ? "" : k)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        ornekKategori === k ? "bg-[#0f1729] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Şablon kartları */}
              {filtreliOrnekler.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Aramanızla eşleşen şablon bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtreliOrnekler.map((s) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-[#c9a84c] bg-[#c9a84c]/10 px-2 py-0.5 rounded-full">{s.kategori}</span>
                            <button
                              onClick={() => toggleFavori(s.id)}
                              title={favoriler.includes(s.id) ? "Favoriden çıkar" : "Favoriye ekle"}
                              className="text-gray-300 hover:text-[#c9a84c] transition-colors"
                            >
                              <Star className={`w-4 h-4 ${favoriler.includes(s.id) ? "fill-[#c9a84c] text-[#c9a84c]" : ""}`} />
                            </button>
                          </div>
                          <p className="font-heading text-sm font-bold text-[#0f1729]">{s.baslik}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.aciklama}</p>
                          <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed font-mono">{s.icerik.slice(0, 150)}...</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <button
                            onClick={() => ornekEditordeAc(s)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editörde Aç
                          </button>
                          <div className="flex items-center gap-1">
                            {(["pdf", "word", "udf"] as const).map((f) => (
                              <button
                                key={f}
                                onClick={() => ornekIndir(s, f)}
                                disabled={ornekIndiriliyor === `${s.id}-${f}`}
                                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors disabled:opacity-50"
                              >
                                {ornekIndiriliyor === `${s.id}-${f}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Download className="w-3 h-3" />
                                )}
                                {f.toUpperCase()}
                              </button>
                            ))}
                          </div>
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
