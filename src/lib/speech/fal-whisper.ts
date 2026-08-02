// fal.ai / Whisper sağlayıcısı — HAZIR DURUR, FAL_KEY env gelince devreye girer.
// Mikrofonu MediaRecorder ile kaydeder, durunca ses blob'unu /api/speech/transcribe'a
// gönderir; sunucu FAL_KEY yoksa 501 döner (web-speech'e düşülür).

import type { SpeechHandlers, SpeechProvider, SpeechSession } from "./types";

export const falWhisperProvider: SpeechProvider = {
  id: "fal-whisper",

  isAvailable() {
    if (typeof window === "undefined") return false;
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices) return false;
    // Tek satır konfig: bu bayrak açıksa fal sağlayıcı tercih edilir
    return process.env.NEXT_PUBLIC_SPEECH_FAL === "1";
  },

  async start(handlers: SpeechHandlers, opts): Promise<SpeechSession> {
    // getUserMedia yalnızca güvenli bağlamda (https / localhost) çalışır.
    if (!window.isSecureContext) {
      throw new Error("Sesli yazdırma için güvenli bağlantı (https) gerekir.");
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        throw new Error("Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip tekrar deneyin.");
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        throw new Error("Mikrofon bulunamadı. Bir mikrofon bağlayıp tekrar deneyin.");
      }
      throw new Error("Mikrofon başlatılamadı.");
    }

    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    // Maliyet koruması: 2 dakikayı aşınca otomatik durdur ve uyar.
    const autoStop = setTimeout(() => {
      if (rec.state !== "inactive") {
        handlers.onError?.("Kayıt 2 dakikayı aştığı için durduruldu.");
        rec.stop();
      }
    }, 120_000);

    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      clearTimeout(autoStop);
      stream.getTracks().forEach((t) => t.stop());
      // Boş kayıt (hiç konuşulmadı) — sunucuya gitme, kredi harcama.
      if (!chunks.length) { handlers.onEnd?.(); return; }
      handlers.onTranscribing?.(true);
      try {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "kayit.webm");
        form.append("lang", opts?.lang ?? "tr");
        const res = await fetch("/api/speech/transcribe", { method: "POST", body: form });
        if (res.status === 501) { handlers.onError?.("Whisper sağlayıcısı henüz yapılandırılmadı (FAL_KEY yok)."); return; }
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) { handlers.onError?.(data.error ?? "Ses çözümlenemedi."); return; }
        if (data.text) handlers.onFinal(data.text);
        else handlers.onError?.("Ses algılanmadı, metin çıkmadı.");
      } catch {
        handlers.onError?.("Ses gönderilemedi.");
      } finally {
        handlers.onTranscribing?.(false);
        handlers.onEnd?.();
      }
    };

    rec.start();
    return { stop: () => { if (rec.state !== "inactive") rec.stop(); } };
  },
};
