"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Daha önce dismissed edilmiş mi?
    if (localStorage.getItem("pwa-dismissed")) return;

    // iOS kontrolü
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone = ("standalone" in navigator) && (navigator as { standalone?: boolean }).standalone;

    if (ios && !standalone) {
      setIsIOS(true);
      // iOS'ta kısa gecikme ile göster
      setTimeout(() => setShow(true), 3000);
      return;
    }

    // Android / Desktop: beforeinstallprompt olayını yakala
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-dismissed", "1");
  }

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div className="bg-[#1a2744] border border-[#c9a84c]/30 rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-[#c9a84c]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white mb-0.5">Ana Ekrana Ekle</p>
            {isIOS ? (
              <p className="text-xs text-white/50 leading-relaxed">
                Safari&apos;de <strong className="text-white/70">Paylaş</strong> →{" "}
                <strong className="text-white/70">Ana Ekrana Ekle</strong> seçeneğine dokunun.
              </p>
            ) : (
              <p className="text-xs text-white/50 leading-relaxed">
                Mizanım&apos;ı uygulamaya dönüştürün — çevrimdışı çalışır, hızlı açılır.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isIOS && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 text-xs font-medium text-white/40 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
            >
              Şimdi Değil
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-[#c9a84c] hover:bg-[#e7b743] text-white py-2 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Yükle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
