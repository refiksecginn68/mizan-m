"use client";

import { useState } from "react";
import {
  CheckCircle,
  FileText,
  Copy,
  Download,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Cpu,
  StickyNote,
} from "lucide-react";

interface Tespit {
  zaman: string | null;
  kategori: "kirmizi" | "sari" | "mavi";
  etiket: string;
  alinti: string;
  guven: "yuksek" | "dusuk";
}

interface AnalysisResult {
  transkript?: string;
  tespitler?: Tespit[];
  kaliteNotu?: string | null;
  detayli?: string;
  not?: string;
  kaynak?: string;
}

interface CaseOption {
  id: string;
  title: string;
  case_number?: string;
}

interface AnalizSonucuProps {
  result: AnalysisResult;
  fileName: string;
  analysisType: string;
  onClose: () => void;
  cases?: CaseOption[];
  initialCaseId?: string;
}

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  ses: "Ses Analizi",
  goruntu: "Görüntü Analizi",
  video: "Video Analizi",
  pdf: "PDF/Belge Analizi",
  ekran: "Ekran Görüntüsü Analizi",
  ses_karsilastirma: "Ses Karşılaştırma",
};

const KATEGORI_ETIKET: Record<Tespit["kategori"], string> = {
  kirmizi: "Suç teşkil edebilecek",
  sari: "Borç / sözleşme",
  mavi: "Usul / delil",
};

// Erişilebilir kontrast + renk körü için metin etiketi (renge tek başına güvenme).
function kategoriStil(kat: Tespit["kategori"], dusuk: boolean): string {
  const map = {
    kirmizi: dusuk ? "bg-red-50 text-red-700 border-red-200" : "bg-red-100 text-red-900 border-red-300",
    sari: dusuk ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-amber-100 text-amber-900 border-amber-300",
    mavi: dusuk ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-blue-100 text-blue-900 border-blue-300",
  };
  return map[kat];
}

// Transkriptte tespit alıntılarını kategorik renkle vurgula (çakışmayanları işaretle).
function vurgulaTranskript(transkript: string, tespitler: Tespit[]) {
  const lower = transkript.toLowerCase();
  const araliklar = tespitler
    .map((t) => {
      const idx = t.alinti ? lower.indexOf(t.alinti.toLowerCase()) : -1;
      return idx === -1 ? null : { start: idx, end: idx + t.alinti.length, t };
    })
    .filter((a): a is { start: number; end: number; t: Tespit } => a !== null)
    .sort((a, b) => a.start - b.start);

  const temiz: typeof araliklar = [];
  let sonEnd = -1;
  for (const a of araliklar) {
    if (a.start >= sonEnd) { temiz.push(a); sonEnd = a.end; }
  }
  if (!temiz.length) return <>{transkript}</>;

  const nodes: React.ReactNode[] = [];
  let cur = 0;
  temiz.forEach((a, i) => {
    if (a.start > cur) nodes.push(<span key={`n${i}`}>{transkript.slice(cur, a.start)}</span>);
    const dusuk = a.t.guven === "dusuk";
    nodes.push(
      <mark key={`m${i}`} className={`rounded px-1 border ${kategoriStil(a.t.kategori, dusuk)}`} title={KATEGORI_ETIKET[a.t.kategori]}>
        {transkript.slice(a.start, a.end)}
        <span className="ml-1 text-[10px] font-semibold opacity-75">[{a.t.etiket}{dusuk ? " ?" : ""}]</span>
      </mark>,
    );
    cur = a.end;
  });
  if (cur < transkript.length) nodes.push(<span key="son">{transkript.slice(cur)}</span>);
  return <>{nodes}</>;
}

export default function AnalizSonucu({
  result,
  fileName,
  analysisType,
  onClose,
  cases = [],
  initialCaseId = "",
}: AnalizSonucuProps) {
  const [detayAcik, setDetayAcik] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveCaseId, setSaveCaseId] = useState(initialCaseId);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const tespitler = result.tespitler ?? [];

  // Rapor metnini (kopya/indir/kayıt) yapılı sonuçtan üret
  const raporMetni = [
    result.transkript ? `TRANSKRİPT\n${result.transkript}\n` : "",
    tespitler.length
      ? `ÖNEMLİ TESPİTLER\n${tespitler.map((t) => `${t.zaman ? t.zaman + " — " : ""}${t.etiket}: "${t.alinti}"${t.guven === "dusuk" ? " (olası)" : ""}`).join("\n")}\n`
      : "",
    result.kaliteNotu ? `KALİTE NOTU\n${result.kaliteNotu}\n` : "",
    result.not ? `AVUKAT NOTU\n${result.not}\n` : "",
    result.detayli ? `DETAYLI DEĞERLENDİRME\n${result.detayli}` : "",
  ].filter(Boolean).join("\n");

  const handleSaveToCase = async () => {
    if (!saveCaseId) {
      setSaveMsg({ ok: false, text: "Önce bir dava dosyası seçin" });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/buro/medya/kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: saveCaseId,
          fileName,
          analysisType: ANALYSIS_TYPE_LABELS[analysisType] || analysisType,
          reportText: raporMetni,
        }),
      });
      const data = await res.json() as { success?: boolean; document?: { name: string }; error?: string };
      if (res.ok && data.success) {
        setSaveMsg({ ok: true, text: `✓ "${data.document?.name}" dava dosyasına eklendi` });
      } else {
        setSaveMsg({ ok: false, text: data.error ?? "Kaydedilemedi" });
      }
    } catch {
      setSaveMsg({ ok: false, text: "Bağlantı hatası" });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(raporMetni);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `MIZANIM DELİL ANALİZ RAPORU
============================
Dosya: ${fileName}
Analiz Türü: ${ANALYSIS_TYPE_LABELS[analysisType] || analysisType}
Tarih: ${new Date().toLocaleDateString("tr-TR")}
Kaynak: ${result.kaynak || "AI Analizi"}

${raporMetni}

---
⚠️ Mizanım hukuki bilgi sunar, hukuki tavsiye niteliği taşımaz. Bu bir çıkarımdır, suç isnadı değildir.
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analiz_${analysisType}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card border-2 border-primary/20 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-heading text-base font-bold text-primary">
              {ANALYSIS_TYPE_LABELS[analysisType] || "Analiz"} Tamamlandı
            </p>
            <p className="font-body text-xs text-muted-foreground">{fileName}</p>
          </div>
        </div>
        {result.kaynak && (
          <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/15 rounded-full px-3 py-1">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span className="font-body text-xs text-primary">{result.kaynak}</span>
          </div>
        )}
      </div>

      {/* Transkript (vurgulu) */}
      {result.transkript && (
        <div>
          <h4 className="font-heading text-sm font-bold text-primary mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Transkript
          </h4>
          <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4">
            {vurgulaTranskript(result.transkript, tespitler)}
          </p>
        </div>
      )}

      {/* Önemli Tespitler */}
      {tespitler.length > 0 && (
        <div>
          <h4 className="font-heading text-sm font-bold text-primary mb-2">Önemli Tespitler</h4>
          <div className="space-y-1.5">
            {tespitler.map((t, i) => {
              const dusuk = t.guven === "dusuk";
              return (
                <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${kategoriStil(t.kategori, dusuk)}`}>
                  {t.zaman && <span className="font-mono text-xs font-semibold flex-shrink-0 mt-0.5">{t.zaman}</span>}
                  <div className="min-w-0">
                    <span className="text-xs font-bold">{t.etiket}{dusuk ? " (olası)" : ""}</span>
                    <span className="text-[10px] ml-1.5 opacity-70">· {KATEGORI_ETIKET[t.kategori]}</span>
                    <p className="text-sm mt-0.5">&ldquo;{t.alinti}&rdquo;</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Renkler: kırmızı = suç teşkil edebilecek · sarı = borç/sözleşme · mavi = usul/delil. Bu bir çıkarımdır, suç isnadı değildir.</p>
        </div>
      )}

      {/* Kalite notu */}
      {result.kaliteNotu && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="font-body text-xs text-amber-800"><span className="font-semibold">Kalite notu:</span> {result.kaliteNotu}</p>
        </div>
      )}

      {/* Avukat notu */}
      {result.not && (
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <p className="font-body text-xs text-foreground flex items-start gap-2">
            <StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
            <span><span className="font-semibold">Not:</span> {result.not}</span>
          </p>
        </div>
      )}

      {/* Detaylı değerlendirme — varsayılanda gizli */}
      {result.detayli && (
        <div>
          <button
            onClick={() => setDetayAcik((p) => !p)}
            className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            {detayAcik ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {detayAcik ? "Detaylı değerlendirmeyi gizle" : "Detaylı göster (Avukat / Hâkim / Savcı / Bilirkişi gözüyle)"}
          </button>
          {detayAcik && (
            <div className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4 mt-2">
              {result.detayli}
            </div>
          )}
        </div>
      )}

      {/* Yasal uyarı */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="font-body text-xs text-amber-700">
          ⚠️ Bu analiz medyada geçenlerin maddi tespitidir, hukuki tavsiye veya suç isnadı değildir. Delil
          değerlendirmesi için uzman avukata danışınız.
        </p>
      </div>

      {/* Analizi dosyaya ekle */}
      {cases.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <h4 className="font-heading text-sm font-bold text-primary flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Analizi Dosyaya Ekle
          </h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={saveCaseId}
              onChange={(e) => setSaveCaseId(e.target.value)}
              className="input-field flex-1"
            >
              <option value="">Dava dosyası seçin...</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.case_number ? `— ${c.case_number}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveToCase}
              disabled={saving || !saveCaseId}
              className="btn-accent text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
              Dosyaya Kaydet
            </button>
          </div>
          {saveMsg && (
            <p className={`font-body text-xs ${saveMsg.ok ? "text-green-700" : "text-red-600"}`}>{saveMsg.text}</p>
          )}
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
        <button onClick={handleCopy} className="btn-outline text-sm flex items-center gap-2">
          <Copy className="w-4 h-4" />
          {copied ? "Kopyalandı!" : "Kopyala"}
        </button>
        <button onClick={handleDownload} className="btn-outline text-sm flex items-center gap-2">
          <Download className="w-4 h-4" />
          Raporu İndir
        </button>
        <button onClick={onClose} className="btn-outline text-sm ml-auto">
          Yeni Analiz
        </button>
      </div>
    </div>
  );
}
