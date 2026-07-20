// Tarayıcı yerleşik Web Speech API sağlayıcısı — ÜCRETSİZ, API key gerektirmez.
// Chrome/Edge'de webkitSpeechRecognition olarak bulunur. Dil varsayılanı tr-TR.

import type { SpeechHandlers, SpeechProvider, SpeechSession } from "./types";

// Web Speech API tip tanımları (lib.dom bunları her ortamda içermez)
interface SRAlternative { transcript: string }
interface SRResult { 0: SRAlternative; isFinal: boolean; length: number }
interface SRResultList { length: number; item: (i: number) => SRResult;[i: number]: SRResult }
interface SREvent extends Event { resultIndex: number; results: SRResultList }
interface SRErrorEvent extends Event { error: string }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SRConstructor = new () => SpeechRecognitionLike;

function getCtor(): SRConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const HATA_MESAJLARI: Record<string, string> = {
  "not-allowed": "Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.",
  "no-speech": "Ses algılanmadı. Tekrar deneyin.",
  "audio-capture": "Mikrofon bulunamadı.",
  "network": "Ağ hatası — ses tanıma sunucusuna ulaşılamadı.",
};

export const webSpeechProvider: SpeechProvider = {
  id: "web-speech",

  isAvailable() {
    return getCtor() !== undefined;
  },

  async start(handlers: SpeechHandlers, opts): Promise<SpeechSession> {
    const Ctor = getCtor();
    if (!Ctor) throw new Error("Web Speech API bu tarayıcıda desteklenmiyor.");

    const rec = new Ctor();
    rec.lang = opts?.lang ?? "tr-TR";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: SREvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const metin = res[0].transcript;
        if (res.isFinal) handlers.onFinal(metin);
        else interim += metin;
      }
      if (interim && handlers.onPartial) handlers.onPartial(interim);
    };

    rec.onerror = (e: SRErrorEvent) => {
      handlers.onError?.(HATA_MESAJLARI[e.error] ?? `Ses tanıma hatası: ${e.error}`);
    };

    rec.onend = () => handlers.onEnd?.();

    rec.start();
    return { stop: () => rec.stop() };
  },
};
