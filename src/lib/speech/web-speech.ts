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
  "not-allowed": "Mikrofon izni gerekli — adres çubuğundaki kilit ikonundan izin verin.",
  "service-not-allowed": "Ses tanıma servisi bu tarayıcıda engellenmiş. Chrome kullanmayı deneyin.",
  "no-speech": "Ses algılanmadı. Tekrar deneyin.",
  "audio-capture": "Mikrofon bulunamadı. Bir mikrofon bağlayıp tekrar deneyin.",
  "network": "Ağ hatası — ses tanıma sunucusuna ulaşılamadı. İnternet bağlantınızı kontrol edin.",
  "aborted": "Ses tanıma iptal edildi.",
};

// Teşhis çıktısı: kullanıcı ortamında sorun olursa konsoldan tek bakışta sebep görülür
function dbg(...args: unknown[]) {
  console.info("[Mizanım Mic]", ...args);
}

// İzni recognition.start()'tan ÖNCE açıkça iste — reddedilirse net mesajla dur.
// (webkitSpeechRecognition izin reddini sessizce onerror'a gömer, prompt bile çıkmayabilir.)
async function izinIste(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    dbg("getUserMedia yok — izin ön kontrolü atlandı (muhtemelen http, güvensiz bağlam)");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    dbg("mikrofon izni OK");
  } catch (e) {
    const name = e instanceof DOMException ? e.name : String(e);
    dbg("getUserMedia hatası:", name);
    if (name === "NotAllowedError" || name === "PermissionDeniedError")
      throw new Error("Mikrofon izni gerekli — adres çubuğundaki kilit ikonundan izin verin.");
    if (name === "NotFoundError" || name === "DevicesNotFoundError")
      throw new Error("Mikrofon bulunamadı. Bir mikrofon bağlayıp tekrar deneyin.");
    if (name === "NotReadableError")
      throw new Error("Mikrofon başka bir uygulama tarafından kullanılıyor.");
    throw new Error(`Mikrofona erişilemedi (${name}).`);
  }
}

export const webSpeechProvider: SpeechProvider = {
  id: "web-speech",

  isAvailable() {
    return getCtor() !== undefined;
  },

  async start(handlers: SpeechHandlers, opts): Promise<SpeechSession> {
    const Ctor = getCtor();
    if (!Ctor) throw new Error("Bu tarayıcı sesli yazmayı desteklemiyor. Chrome veya Edge kullanın.");

    if (!window.isSecureContext) {
      dbg("güvensiz bağlam (http) — Web Speech çalışmaz");
      throw new Error("Sesli yazma yalnızca HTTPS üzerinde çalışır.");
    }

    await izinIste();

    const rec = new Ctor();
    rec.lang = opts?.lang ?? "tr-TR";
    rec.continuous = true;
    rec.interimResults = true;

    // Kullanıcı durdurmadan onend gelirse (Chrome süre sınırı, sessizlik) oturumu yeniden başlat
    let kullaniciDurdurdu = false;

    rec.onresult = (e: SREvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const metin = res[0].transcript;
        if (res.isFinal) {
          dbg("final:", metin);
          handlers.onFinal(metin);
        } else interim += metin;
      }
      if (interim && handlers.onPartial) handlers.onPartial(interim);
    };

    rec.onerror = (e: SRErrorEvent) => {
      dbg("onerror:", e.error);
      // no-speech continuous modda rutin — oturumu düşürme, onend restart'ı halleder
      if (e.error === "no-speech") return;
      kullaniciDurdurdu = true;
      handlers.onError?.(HATA_MESAJLARI[e.error] ?? `Ses tanıma hatası: ${e.error}`);
    };

    rec.onend = () => {
      dbg("onend, kullanıcı durdurdu:", kullaniciDurdurdu);
      if (kullaniciDurdurdu) {
        handlers.onEnd?.();
        return;
      }
      // Chrome ~60 sn sonra veya sessizlikte oturumu kendiliğinden kapatır — devam et
      try {
        rec.start();
        dbg("oturum otomatik yeniden başlatıldı");
      } catch {
        handlers.onEnd?.();
      }
    };

    rec.start();
    dbg("dinleme başladı, dil:", rec.lang);
    return {
      stop: () => {
        kullaniciDurdurdu = true;
        rec.stop();
      },
    };
  },
};
