import type { SpeechProvider } from "./types";
import { webSpeechProvider } from "./web-speech";
import { falWhisperProvider } from "./fal-whisper";

export type { SpeechProvider, SpeechHandlers, SpeechSession } from "./types";

// Kullanılabilir sağlayıcıyı seçer: fal.ai açıksa (NEXT_PUBLIC_SPEECH_FAL=1 + FAL_KEY)
// onu, aksi halde ücretsiz Web Speech'i kullanır. Hiçbiri yoksa undefined döner
// (UI mikrofon butonunu gizler).
export function getSpeechProvider(): SpeechProvider | undefined {
  if (falWhisperProvider.isAvailable()) return falWhisperProvider;
  if (webSpeechProvider.isAvailable()) return webSpeechProvider;
  return undefined;
}
