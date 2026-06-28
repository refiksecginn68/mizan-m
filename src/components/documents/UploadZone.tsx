"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UploadZoneProps {
  onUploadComplete?: (documentId: string) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) return "Sadece PDF, JPG, PNG veya WebP dosyası yükleyebilirsiniz.";
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Dosya boyutu en fazla ${MAX_SIZE_MB} MB olmalıdır.`;
    return null;
  }, []);

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
    setError("");
    setStatus("idle");
    setUploadedId(null);
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json() as { documentId?: string; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Yükleme başarısız.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setUploadedId(data.documentId ?? null);
      onUploadComplete?.(data.documentId ?? "");
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
      setStatus("error");
    }
  }

  function handleAnalyze() {
    if (uploadedId) router.push(`/asistan?doc=${uploadedId}`);
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-accent bg-accent/5"
            : file
            ? "border-primary/30 bg-primary/5"
            : "border-border hover:border-accent/50 hover:bg-accent/5"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div className="text-left">
              <p className="font-body text-sm font-medium text-primary">{file.name}</p>
              <p className="font-body text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setStatus("idle"); }}
              className="ml-auto text-muted-foreground hover:text-danger transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm font-medium text-primary mb-1">
              Dosyayı buraya sürükleyin veya tıklayın
            </p>
            <p className="font-body text-xs text-muted-foreground">
              PDF, JPG, PNG — maks. {MAX_SIZE_MB} MB
            </p>
          </>
        )}
      </div>

      {/* Hata */}
      {error && (
        <div className="flex items-center gap-2 text-danger text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      {/* Butonlar */}
      {file && status !== "success" && (
        <button
          onClick={handleUpload}
          disabled={status === "uploading"}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Yükleniyor...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Yükle (5 kredi)
            </>
          )}
        </button>
      )}

      {status === "success" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-success text-sm font-body">
            <CheckCircle className="w-4 h-4" />
            Belge başarıyla yüklendi!
          </div>
          <button onClick={handleAnalyze} className="btn-primary w-full">
            AI ile Analiz Et →
          </button>
        </div>
      )}
    </div>
  );
}
