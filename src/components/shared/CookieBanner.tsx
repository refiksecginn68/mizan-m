"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Settings } from "lucide-react";

type Consent = "accepted" | "rejected" | "custom";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookie-consent");
    if (!stored) setVisible(true);
  }, []);

  function save(consent: Consent) {
    localStorage.setItem("cookie-consent", consent);
    if (consent === "custom") {
      localStorage.setItem("cookie-analytics", analytics ? "1" : "0");
      localStorage.setItem("cookie-marketing", marketing ? "1" : "0");
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-[#0f1729] border border-white/10 rounded-2xl shadow-2xl text-white overflow-hidden">
        {!showSettings ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5">
            <Cookie className="w-6 h-6 text-[#c9a84c] flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 text-sm text-white/80 leading-relaxed">
              Sizin için en iyi deneyimi sunmak amacıyla çerezler kullanıyoruz.{" "}
              <Link href="/cerez-politikasi" className="text-[#c9a84c] hover:underline">
                Çerez Politikası
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Settings className="w-3 h-3" />
                Ayarlar
              </button>
              <button
                onClick={() => save("rejected")}
                className="px-3 py-1.5 text-xs border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Reddet
              </button>
              <button
                onClick={() => save("accepted")}
                className="px-4 py-1.5 text-xs bg-[#c9a84c] hover:bg-[#e7b743] rounded-lg font-semibold transition-colors"
              >
                Kabul Et
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Çerez Ayarları</h3>
              <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <div>
                  <p className="font-medium">Zorunlu Çerezler</p>
                  <p className="text-xs text-white/50 mt-0.5">Oturum ve güvenlik için gerekli</p>
                </div>
                <span className="text-xs text-white/40">Her zaman açık</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <div>
                  <p className="font-medium">Analitik Çerezler</p>
                  <p className="text-xs text-white/50 mt-0.5">Kullanım istatistikleri</p>
                </div>
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${analytics ? "bg-[#c9a84c]" : "bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${analytics ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Pazarlama Çerezleri</p>
                  <p className="text-xs text-white/50 mt-0.5">Kişiselleştirilmiş içerik</p>
                </div>
                <button
                  onClick={() => setMarketing(!marketing)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${marketing ? "bg-[#c9a84c]" : "bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${marketing ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => save("custom")}
                className="flex-1 py-2 text-xs bg-[#c9a84c] hover:bg-[#e7b743] rounded-lg font-semibold transition-colors"
              >
                Kaydet
              </button>
              <button
                onClick={() => save("accepted")}
                className="flex-1 py-2 text-xs border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Tümünü Kabul Et
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
