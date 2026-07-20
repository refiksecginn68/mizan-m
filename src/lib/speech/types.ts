// Sesli metin (STT) sağlayıcı soyutlaması.
// Amaç: UI aynı arayüzü kullanırken arkasında ücretsiz (Web Speech) veya
// yükseltilmiş (fal.ai/Whisper) sağlayıcı çalışabilsin.

export interface SpeechHandlers {
  // Konuşma sürerken güncellenen geçici (henüz kesinleşmemiş) metin
  onPartial?: (text: string) => void;
  // Kesinleşen metin parçası — hedef alana bu eklenir
  onFinal: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export interface SpeechSession {
  stop: () => void;
}

export interface SpeechProvider {
  readonly id: "web-speech" | "fal-whisper";
  // Bu ortamda (tarayıcı desteği / yapılandırma) kullanılabilir mi?
  isAvailable: () => boolean;
  start: (handlers: SpeechHandlers, opts?: { lang?: string }) => Promise<SpeechSession>;
}
