"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  FileUp, Check, X, Loader2,
  AlertCircle, FolderOpen, FileText, Clock,
} from "lucide-react";

interface TalepBilgi {
  clientName: string;
  lawyerName: string;
  caseName?: string;
  caseNumber?: string;
  message: string;
  expiresAt: string;
  status: string;
}

interface UploadedFile {
  file: File;
  status: "waiting" | "uploading" | "done" | "error";
  error?: string;
}

export default function BelgeYuklemeClient({ token }: { token: string }) {
  const [bilgi, setBilgi] = useState<TalepBilgi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/belge-yukle/${token}`);
        if (!res.ok) {
          const data = await res.json() as { error: string };
          setError(data.error);
          return;
        }
        const data = await res.json() as TalepBilgi;
        setBilgi(data);
        if (data.status === "completed") setDone(true);
      } catch {
        setError("Bağlantı hatası");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const toAdd: UploadedFile[] = Array.from(newFiles).map((f) => ({
      file: f,
      status: "waiting",
    }));
    setFiles((prev) => [...prev, ...toAdd]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    if (!files.length || uploading) return;
    setUploading(true);

    const form = new FormData();
    files.forEach((f) => form.append("files", f.file));
    form.append("note", note);

    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));

    try {
      const res = await fetch(`/api/belge-yukle/${token}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json() as {
        success: boolean;
        uploaded: string[];
        errors: string[];
      };

      if (data.success) {
        setFiles((prev) =>
          prev.map((f) => ({
            ...f,
            status: data.uploaded.includes(f.file.name) ? "done" : "error",
            error: data.errors.find((e) => e.startsWith(f.file.name)),
          }))
        );
        setDone(true);
      } else {
        setFiles((prev) => prev.map((f) => ({ ...f, status: "error", error: "Yükleme başarısız" })));
      }
    } catch {
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error", error: "Bağlantı hatası" })));
    }
    setUploading(false);
  }

  function formatExpiry(iso: string) {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="font-heading text-lg font-bold text-[#0f1729] mb-2">Link Geçersiz</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-heading text-xl font-bold text-[#0f1729] mb-2">Belgeler Gönderildi</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Belgeleriniz başarıyla {bilgi?.lawyerName ?? "avukatınıza"} iletildi. Teşekkür ederiz.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-[#1a2744]">
            <div className="w-5 h-5 rounded overflow-hidden bg-[#0f1729]">
              <Image src="/logo.png" alt="Mizanım" width={20} height={20} className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-bold text-sm">Mizanım</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* Header */}
      <header className="bg-[#0f1729] px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#0f1729]">
            <Image src="/logo.png" alt="Mizanım" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-white">Mizanım</p>
            <p className="text-[10px] text-white/40">Güvenli Belge Yükleme</p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Bilgi kartı */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-[#c9a84c]" />
            </div>
            <div>
              <h1 className="font-heading text-base font-bold text-[#0f1729]">Belge Yükleme Talebi</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {bilgi?.lawyerName} tarafından gönderildi
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 bg-[#f4f5f7] rounded-xl px-3 py-2.5">
              <span className="text-xs font-semibold text-gray-500 w-20 flex-shrink-0">Müvekkil</span>
              <span className="text-xs text-[#0f1729] font-semibold">{bilgi?.clientName}</span>
            </div>
            {bilgi?.caseName && (
              <div className="flex items-center gap-2 bg-[#f4f5f7] rounded-xl px-3 py-2.5">
                <span className="text-xs font-semibold text-gray-500 w-20 flex-shrink-0">Dava</span>
                <span className="text-xs text-[#0f1729]">{bilgi.caseName}</span>
              </div>
            )}
          </div>

          {bilgi?.message && (
            <div className="mt-4 bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700 leading-relaxed">{bilgi.message}</p>
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            Son geçerlilik: {bilgi?.expiresAt ? formatExpiry(bilgi.expiresAt) : ""}
          </div>
        </div>

        {/* Yükleme alanı */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-heading text-sm font-bold text-[#0f1729] mb-4">Belgelerinizi Yükleyin</h2>

          {/* Dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5 transition-all mb-4"
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.tiff,.udf"
              onChange={(e) => addFiles(e.target.files)}
            />
            <FileUp className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">Dosya Seç veya Sürükle</p>
            <p className="text-[10px] text-gray-300 mt-1">PDF, DOCX, JPG, PNG, UDF — maks. 20MB/dosya</p>
          </div>

          {/* Dosya listesi */}
          {files.length > 0 && (
            <div className="space-y-2 mb-4">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#f4f5f7] rounded-xl px-3 py-2.5">
                  <FileText className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#0f1729] truncate">{f.file.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {(f.file.size / 1024).toFixed(0)} KB
                      {f.error && <span className="text-red-400 ml-1">— {f.error}</span>}
                    </p>
                  </div>
                  {f.status === "waiting" && (
                    <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {f.status === "uploading" && <Loader2 className="w-4 h-4 text-[#c9a84c] animate-spin flex-shrink-0" />}
                  {f.status === "done" && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  {f.status === "error" && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {/* Not */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Eklemek istediğiniz not... (isteğe bağlı)"
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#c9a84c] resize-none mb-4"
          />

          <button
            onClick={handleUpload}
            disabled={!files.length || uploading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#c9a84c] to-[#e7b743] text-white text-sm font-semibold py-3.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...</>
              : <><FileUp className="w-4 h-4" /> Belgeleri Gönder</>
            }
          </button>

          <p className="text-center text-[10px] text-gray-300 mt-3">
            Belgeleriniz şifreli bağlantı üzerinden güvenle iletilmektedir.
          </p>
        </div>
      </div>
    </div>
  );
}
