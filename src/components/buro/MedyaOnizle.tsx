"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, ZoomIn, ZoomOut } from "lucide-react";

interface Props {
  docId: string;
  name: string;
  fileType: string; // uzantı: mp4, mp3, png, pdf ...
  onClose: () => void;
}

const VIDEO = ["mp4", "webm", "mov", "m4v", "ogv"];
const AUDIO = ["mp3", "wav", "m4a", "ogg", "oga", "aac"];
const IMAGE = ["png", "jpg", "jpeg", "webp", "gif", "tif", "tiff", "bmp"];
const PDF = ["pdf"];

const HIZLAR = [1, 1.25, 1.5, 2];

// Dava dosyasına eklenmiş medyayı yerinde aç/oynat. Taze imzalı URL (inline) alınır;
// tarayıcı medyayı doğrudan Supabase storage'dan range request ile stream eder.
export default function MedyaOnizle({ docId, name, fileType, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [hiz, setHiz] = useState(1);
  const [zoom, setZoom] = useState(1);
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);

  const uzanti = fileType.toLowerCase();
  const tur = VIDEO.includes(uzanti) ? "video"
    : AUDIO.includes(uzanti) ? "audio"
    : IMAGE.includes(uzanti) ? "image"
    : PDF.includes(uzanti) ? "pdf"
    : "diger";

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const res = await fetch(`/api/buro/dava/belge/${docId}?mode=inline`);
        const data = await res.json() as { url?: string; error?: string };
        if (iptal) return;
        if (!res.ok || !data.url) { setHata(data.error ?? "Açılamadı"); return; }
        setUrl(data.url);
      } catch {
        if (!iptal) setHata("Bağlantı hatası");
      }
    })();
    return () => { iptal = true; };
  }, [docId]);

  // ESC ile kapat
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function hizDegistir() {
    const siradaki = HIZLAR[(HIZLAR.indexOf(hiz) + 1) % HIZLAR.length];
    setHiz(siradaki);
    if (mediaRef.current) mediaRef.current.playbackRate = siradaki;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-body text-sm font-semibold text-foreground truncate pr-3">{name}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(tur === "video" || tur === "audio") && url && (
              <button onClick={hizDegistir} className="text-xs font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                {hiz}x
              </button>
            )}
            {tur === "image" && url && (
              <>
                <button onClick={() => setZoom((z) => Math.max(1, z - 0.25))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Uzaklaştır"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Yakınlaştır"><ZoomIn className="w-4 h-4" /></button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Kapat"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center min-h-[240px]">
          {hata ? (
            <p className="text-sm text-red-600 p-8">{hata}</p>
          ) : !url ? (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          ) : tur === "video" ? (
            <video ref={mediaRef} src={url} controls autoPlay className="w-full max-h-[75vh] bg-black" />
          ) : tur === "audio" ? (
            <div className="w-full p-8">
              <audio ref={mediaRef} src={url} controls autoPlay className="w-full" />
            </div>
          ) : tur === "image" ? (
            <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={name} style={{ transform: `scale(${zoom})` }} className="max-w-full transition-transform origin-center" />
            </div>
          ) : tur === "pdf" ? (
            <iframe src={url} title={name} className="w-full h-[75vh] border-0" />
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">Bu dosya türü ({uzanti || "?"}) yerinde önizlenemiyor.</p>
              <a href={`/api/buro/dava/belge/${docId}`} className="btn-outline text-sm">İndir</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
