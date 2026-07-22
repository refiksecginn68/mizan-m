"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { getSpeechProvider, type SpeechSession } from "@/lib/speech";

interface Props {
  // Kesinleşen her metin parçası için çağrılır — çağıran alanı günceller
  onTranscript: (text: string) => void;
  // Konuşurken oluşan geçici metin (canlı önizleme — hedef alana anlık yazılır)
  onInterim?: (text: string) => void;
  // Dinleme başlamadan hemen önce çağrılır — çağıran mevcut metni taban alır
  onStart?: () => void;
  className?: string;
  title?: string;
}

// Sesli giriş butonu. Sağlayıcı yoksa (tarayıcı desteklemiyorsa) hiç render edilmez.
export default function MicButton({ onTranscript, onInterim, onStart, className = "", title }: Props) {
  const [destekli, setDestekli] = useState(false);
  const [dinliyor, setDinliyor] = useState(false);
  const [baslatiliyor, setBaslatiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const sessionRef = useRef<SpeechSession | null>(null);

  useEffect(() => {
    setDestekli(getSpeechProvider() !== undefined);
    return () => sessionRef.current?.stop();
  }, []);

  // Hata balonu bir süre sonra kendiliğinden kapansın
  useEffect(() => {
    if (!hata) return;
    const t = setTimeout(() => setHata(""), 8000);
    return () => clearTimeout(t);
  }, [hata]);

  if (!destekli) return null;

  async function basla() {
    setHata("");
    const provider = getSpeechProvider();
    if (!provider) return;
    console.info("[Mizanım Mic] buton tıklandı, sağlayıcı:", provider.id);
    onStart?.();
    setBaslatiliyor(true);
    try {
      sessionRef.current = await provider.start(
        {
          onFinal: (t) => onTranscript(t.trim() ? t.trim() + " " : ""),
          onPartial: onInterim,
          onError: (m) => { setHata(m); setDinliyor(false); },
          onEnd: () => setDinliyor(false),
        },
        { lang: "tr-TR" },
      );
      setDinliyor(true);
    } catch (e) {
      const mesaj = (e as Error).message || "Mikrofon başlatılamadı";
      console.info("[Mizanım Mic] başlatılamadı:", mesaj);
      setHata(mesaj);
    } finally {
      setBaslatiliyor(false);
    }
  }

  function durdur() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setDinliyor(false);
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={dinliyor ? durdur : basla}
        disabled={baslatiliyor}
        title={hata || title || (dinliyor ? "Kaydı durdur" : "Sesle yaz")}
        aria-label={dinliyor ? "Kaydı durdur" : "Sesle yaz"}
        className={`inline-flex items-center justify-center rounded-lg transition-colors ${
          dinliyor
            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
            : hata
              ? "bg-red-50 text-red-500 hover:bg-red-100"
              : "bg-gray-100 text-gray-500 hover:bg-[#7c3aed]/10 hover:text-[#7c3aed]"
        } ${className}`}
      >
        {baslatiliyor
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : dinliyor
            ? <Square className="w-4 h-4" />
            : <Mic className="w-4 h-4" />}
      </button>
      {hata && (
        <span
          role="alert"
          className="absolute top-full right-0 mt-1.5 z-50 w-60 rounded-lg bg-red-600 text-white text-[11px] leading-snug px-2.5 py-1.5 shadow-lg"
        >
          {hata}
        </span>
      )}
    </span>
  );
}
