"use client";

import { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Copy,
  Download,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";

interface AnalysisResult {
  ozet?: string;
  hukukiDegerlendirme?: string;
  oneriler?: string[];
  kaynak?: string;
  rawText?: string;
  demo?: boolean;
  falKeyGerekildi?: boolean;
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
  onSaveToCase?: () => void;
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

export default function AnalizSonucu({
  result,
  fileName,
  analysisType,
  onClose,
  onSaveToCase,
  cases = [],
  initialCaseId = "",
}: AnalizSonucuProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveCaseId, setSaveCaseId] = useState(initialCaseId);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Analizi seçilen mahkeme dosyasına kaydet (case_documents)
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
          reportText: result.rawText || result.hukukiDegerlendirme || result.ozet || "",
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
    const text = result.rawText || result.hukukiDegerlendirme || "";
    await navigator.clipboard.writeText(text);
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

ÖZET
----
${result.ozet || ""}

HUKUKİ DEĞERLENDİRME
---------------------
${result.hukukiDegerlendirme || ""}

ÖNERİLER
---------
${(result.oneriler || []).map((o, i) => `${i + 1}. ${o}`).join("\n")}

---
⚠️ Mizanım hukuki bilgi sunar, hukuki tavsiye niteliği taşımaz.
   Hukuki durumunuz için bir avukata danışmanız önerilir.
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

      {result.falKeyGerekildi && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-amber-800">fal.ai Entegrasyonu Gerekli</p>
            <p className="font-body text-xs text-amber-700 mt-0.5">{result.hukukiDegerlendirme}</p>
          </div>
        </div>
      )}

      {!result.falKeyGerekildi && (
        <>
          {/* Özet */}
          {result.ozet && (
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
              <h4 className="font-heading text-sm font-bold text-primary mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Özet
              </h4>
              <p className="font-body text-sm text-foreground leading-relaxed">{result.ozet}</p>
            </div>
          )}

          {/* Hukuki Değerlendirme */}
          {result.hukukiDegerlendirme && result.hukukiDegerlendirme !== result.ozet && (
            <div>
              <h4 className="font-heading text-sm font-bold text-primary mb-2">Hukuki Değerlendirme</h4>
              <div className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4">
                {result.hukukiDegerlendirme.length > 600
                  ? (
                    <>
                      {showRaw
                        ? result.hukukiDegerlendirme
                        : result.hukukiDegerlendirme.substring(0, 600) + "..."}
                      <button
                        onClick={() => setShowRaw((p) => !p)}
                        className="flex items-center gap-1 text-accent text-xs mt-2 font-medium"
                      >
                        {showRaw ? <><ChevronUp className="w-3 h-3" />Daha az göster</> : <><ChevronDown className="w-3 h-3" />Tamamını göster</>}
                      </button>
                    </>
                  )
                  : result.hukukiDegerlendirme
                }
              </div>
            </div>
          )}

          {/* Öneriler */}
          {result.oneriler && result.oneriler.length > 0 && (
            <div>
              <h4 className="font-heading text-sm font-bold text-primary mb-2">Öneriler</h4>
              <ul className="space-y-2">
                {result.oneriler.map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center flex-shrink-0 font-semibold mt-0.5">
                      {i + 1}
                    </div>
                    <p className="font-body text-sm text-foreground">{o}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Yasal uyarı */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="font-body text-xs text-amber-700">
          ⚠️ Bu analiz genel bilgi amaçlıdır, hukuki tavsiye niteliği taşımaz. Delil değerlendirmesi
          için mutlaka uzman avukata danışınız.
        </p>
      </div>

      {/* Analizi dosyaya ekle */}
      {!result.falKeyGerekildi && cases.length > 0 && (
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
        <button
          onClick={handleCopy}
          className="btn-outline text-sm flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Kopyalandı!" : "Kopyala"}
        </button>
        <button
          onClick={handleDownload}
          className="btn-outline text-sm flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Raporu İndir
        </button>
        {onSaveToCase && (
          <button
            onClick={onSaveToCase}
            className="btn-accent text-sm flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Davaya Ekle
          </button>
        )}
        <button
          onClick={onClose}
          className="btn-outline text-sm ml-auto"
        >
          Yeni Analiz
        </button>
      </div>
    </div>
  );
}
