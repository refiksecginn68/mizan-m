"use client";

import { useState, useRef, useCallback } from "react";
import {
  Mic,
  Image,
  Video,
  FileText,
  Monitor,
  GitCompare,
  Upload,
  X,
  AlertCircle,
  Info,
} from "lucide-react";
import AnalizSonucu from "./AnalizSonucu";

interface Case {
  id: string;
  title: string;
  case_number?: string;
}

interface AnalysisResult {
  ozet?: string;
  hukukiDegerlendirme?: string;
  oneriler?: string[];
  kaynak?: string;
  rawText?: string;
  demo?: boolean;
  falKeyGerekildi?: boolean;
}

interface AnalysisResponse {
  success: boolean;
  analysisType: string;
  result: AnalysisResult;
  fileName: string;
  fileSize: number;
  caseId?: string;
  error?: string;
}

interface AnalysisCard {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  accept: string;
  maxSizeMB: number;
  needsFal: boolean;
  hint: string;
}

const ANALYSIS_CARDS: AnalysisCard[] = [
  {
    id: "goruntu",
    label: "Görüntü Analizi",
    icon: Image,
    description: "Fotoğraf delil analizi — tarih/saat metadata, içerik değerlendirmesi",
    accept: "image/jpeg,image/png,image/webp,image/gif",
    maxSizeMB: 10,
    needsFal: false,
    hint: "JPEG, PNG, WEBP, GIF (max 10MB)",
  },
  {
    id: "pdf",
    label: "PDF/Belge Analizi",
    icon: FileText,
    description: "Sözleşme ve mahkeme kararı — yapısal analiz, risk tespiti",
    accept: "application/pdf",
    maxSizeMB: 20,
    needsFal: false,
    hint: "PDF formatı (max 20MB)",
  },
  {
    id: "ekran",
    label: "Ekran Görüntüsü",
    icon: Monitor,
    description: "Sosyal medya/mesajlaşma ekran görüntüsü — dijital delil analizi",
    accept: "image/jpeg,image/png,image/webp",
    maxSizeMB: 10,
    needsFal: false,
    hint: "JPEG, PNG, WEBP (max 10MB)",
  },
  {
    id: "ses",
    label: "Ses Analizi",
    icon: Mic,
    description: "Ses kaydı transkripti ve hukuki önem tespiti (fal.ai gerektirir)",
    accept: "audio/*",
    maxSizeMB: 50,
    needsFal: true,
    hint: "MP3, WAV, M4A (max 50MB) — fal.ai gerektirir",
  },
  {
    id: "video",
    label: "Video Analizi",
    icon: Video,
    description: "Video içerik özeti ve kritik an tespiti (fal.ai gerektirir)",
    accept: "video/*",
    maxSizeMB: 100,
    needsFal: true,
    hint: "MP4, MOV, AVI (max 100MB) — fal.ai gerektirir",
  },
  {
    id: "ses_karsilastirma",
    label: "Ses Karşılaştırma",
    icon: GitCompare,
    description: "İki ses kaydını karşılaştırarak konuşmacı analizi (fal.ai gerektirir)",
    accept: "audio/*",
    maxSizeMB: 50,
    needsFal: true,
    hint: "MP3, WAV, M4A (max 50MB) — fal.ai gerektirir",
  },
];

interface MedyaClientProps {
  cases: Case[];
}

export default function MedyaClient({ cases }: MedyaClientProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCardData = ANALYSIS_CARDS.find((c) => c.id === selectedCard);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      if (!selectedCardData) return;
      const maxBytes = selectedCardData.maxSizeMB * 1024 * 1024;
      if (selectedFile.size > maxBytes) {
        setError(`Dosya boyutu ${selectedCardData.maxSizeMB}MB limitini aşıyor`);
        return;
      }
      setFile(selectedFile);
      setError("");
    },
    [selectedCardData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(dropped);
    },
    [handleFileSelect]
  );

  const handleAnalyze = async () => {
    if (!file || !selectedCard) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("analysisType", selectedCard);
      if (caseId) formData.append("caseId", caseId);

      const res = await fetch("/api/buro/medya/analyze", {
        method: "POST",
        body: formData,
      });

      const json: AnalysisResponse = await res.json();

      if (!res.ok) {
        setError(json.error || "Analiz başarısız");
        return;
      }

      setResult(json);
    } catch {
      setError("Bağlantı hatası oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setError("");
  };

  // Sonuç göster
  if (result) {
    return (
      <AnalizSonucu
        result={result.result}
        fileName={result.fileName}
        analysisType={result.analysisType}
        onClose={handleReset}
        cases={cases}
        initialCaseId={result.caseId ?? ""}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* fal.ai bilgisi */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-sm font-semibold text-blue-800">AI Analiz Motoru</p>
          <p className="font-body text-xs text-blue-700 mt-0.5">
            Görüntü, PDF ve ekran görüntüleri Claude AI ile analiz edilir.
            Ses ve video analizi için fal.ai entegrasyonu gerekir (FAL_KEY ayarlandığında aktive olur).
          </p>
        </div>
      </div>

      {/* Analiz türü kartları */}
      {!selectedCard && (
        <>
          <h2 className="font-heading text-lg font-bold text-primary">Analiz Türü Seçin</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ANALYSIS_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedCard(card.id);
                    setFile(null);
                    setError("");
                  }}
                  className={`card text-left hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 group relative ${
                    card.needsFal ? "opacity-80" : ""
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    card.needsFal
                      ? "bg-muted/70 group-hover:bg-muted"
                      : "bg-primary/10 group-hover:bg-primary/20"
                  }`}>
                    <Icon className={`w-6 h-6 ${card.needsFal ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <h3 className="font-heading text-base font-bold text-primary mb-1">{card.label}</h3>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                  {card.needsFal && (
                    <span className="absolute top-3 right-3 font-body text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      fal.ai
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Dosya yükleme ve analiz */}
      {selectedCard && selectedCardData && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedCard(null);
                setFile(null);
                setError("");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Geri
            </button>
            <h2 className="font-heading text-lg font-bold text-primary">{selectedCardData.label}</h2>
          </div>

          <div className="card space-y-5">
            {/* Drag & drop alanı */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-success bg-success/5"
                  : "border-border hover:border-primary/50 hover:bg-primary/3"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={selectedCardData.accept}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />

              {file ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 text-success" />
                  </div>
                  <p className="font-body text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-danger transition-colors mt-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Dosyayı kaldır
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-body text-sm font-semibold text-foreground">
                    Dosyayı sürükleyin veya tıklayın
                  </p>
                  <p className="font-body text-xs text-muted-foreground">{selectedCardData.hint}</p>
                </div>
              )}
            </div>

            {/* Dava seçimi */}
            {cases.length > 0 && (
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                  Dava ile İlişkilendir (Opsiyonel)
                </label>
                <select
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Dava seçin (opsiyonel)</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.case_number ? `— ${c.case_number}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                <p className="font-body text-sm text-danger">{error}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || !file}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analiz ediliyor... Bu birkaç saniye sürebilir
                </>
              ) : (
                <>
                  <selectedCardData.icon className="w-4 h-4" />
                  Analiz Et
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
