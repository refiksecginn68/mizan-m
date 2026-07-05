"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Download, Trash2, Loader2, Image as ImageIcon } from "lucide-react";

interface CaseDoc {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface Props {
  caseId: string;
  initialDocuments: CaseDoc[];
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const IMAGE_TYPES = ["png", "jpg", "jpeg", "webp", "gif", "tif", "tiff"];

export default function DavaBelgeler({ caseId, initialDocuments }: Props) {
  const [documents, setDocuments] = useState<CaseDoc[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`/api/buro/dava/${caseId}/belge`, { method: "POST", body: form });
      const data = await res.json() as { success?: boolean; document?: CaseDoc; error?: string };
      if (!res.ok || !data.document) {
        setError(data.error ?? "Yükleme başarısız");
      } else {
        setDocuments((d) => [data.document!, ...d]);
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/buro/dava/belge/${id}`, { method: "DELETE" });
      if (res.ok) setDocuments((d) => d.filter((doc) => doc.id !== id));
    } catch { /* ignore */ }
    setDeletingId(null);
  }

  return (
    <div>
      {/* Yükleme alanı */}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.udf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.png,.jpg,.jpeg,.webp,.gif,.tif,.tiff,.zip,.eyp"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-3 mb-3 border-2 border-dashed border-border rounded-xl text-sm font-body text-muted-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...</>
        ) : (
          <><Upload className="w-4 h-4" /> Belge Yükle (PDF, UDF, Word, görsel...)</>
        )}
      </button>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {documents.length === 0 ? (
        <div className="text-center py-6 border border-border rounded-xl">
          <FileText className="w-7 h-7 text-muted-foreground mx-auto mb-1.5" />
          <p className="font-body text-sm text-muted-foreground">Bu davaya henüz belge eklenmedi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const isImage = IMAGE_TYPES.includes(doc.file_type?.toLowerCase());
            return (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 group">
                {isImage
                  ? <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  : <FileText className="w-4 h-4 text-primary flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground truncate">{doc.name}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString("tr-TR")} · {formatSize(doc.file_size)}
                    {doc.file_type && <span className="uppercase ml-1">· {doc.file_type}</span>}
                  </p>
                </div>
                <a
                  href={`/api/buro/dava/belge/${doc.id}`}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="İndir"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Sil"
                >
                  {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
