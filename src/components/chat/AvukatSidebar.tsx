"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X, Minus, Scale } from "lucide-react";
import ChatWindow from "./ChatWindow";

interface Props {
  lawyerName?: string;
  creditBalance?: number;
  caseContext?: string;
}

export default function AvukatSidebar({ lawyerName, creditBalance, caseContext }: Props) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Escape tuşuyla kapat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Kapalıyken — sağ alt köşe butonu */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-primary shadow-2xl flex items-center justify-center hover:scale-105 transition-transform group"
          title="AI Asistan"
        >
          <MessageSquare className="w-6 h-6 text-accent" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          <span className="absolute right-16 bg-primary text-accent text-xs font-body px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            AI Asistan
          </span>
        </button>
      )}

      {/* Açıkken — sağ kenarda panel */}
      {open && (
        <div
          className={`fixed right-0 z-50 flex flex-col bg-background border-l border-border shadow-2xl transition-all duration-300 ${
            minimized
              ? "bottom-0 w-80 h-12"
              : "bottom-0 top-0 w-96 max-w-[95vw]"
          }`}
          style={{ top: minimized ? undefined : 0 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Scale className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm font-bold text-white leading-tight">
                Mizanım AI Asistan
              </p>
              {lawyerName && (
                <p className="font-body text-xs text-white/60 truncate">
                  {lawyerName}
                </p>
              )}
            </div>
            <button
              onClick={() => setMinimized(!minimized)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
              title={minimized ? "Aç" : "Küçült"}
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
              title="Kapat"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Chat alanı */}
          {!minimized && (
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                userType="avukat"
                creditBalance={creditBalance}
                caseContext={caseContext}
                placeholder="Hukuki soru sorun..."
                compact={true}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
