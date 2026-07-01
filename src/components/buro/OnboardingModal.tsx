"use client";

import { useState, useEffect } from "react";
import { X, User, FolderPlus, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    icon: User,
    title: "Profilinizi Tamamlayın",
    desc: "Baro bilgileri ve iletişim bilgilerinizi ekleyin. Müvekkiller profilinizi görecek.",
    action: { label: "Profile Git", href: "/profil" },
  },
  {
    icon: FolderPlus,
    title: "İlk Müvekkilinizi Ekleyin",
    desc: "Müvekkil kaydı oluşturarak dava takibine başlayın.",
    action: { label: "Müvekkil Ekle", href: "/buro/muvekkiller" },
  },
  {
    icon: Calendar,
    title: "Takvimi Bağlayın",
    desc: "Google Takvim entegrasyonu ile duruşmaları takip edin.",
    action: { label: "Takvimi Kur", href: "/buro/takvim" },
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem("onboarding-done");
    if (!done) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem("onboarding-done", "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-[#0f1729] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
              Adım {step + 1} / {STEPS.length}
            </p>
            <h2 className="font-heading text-xl font-bold text-white mt-0.5">
              Büronuzu Kurun
            </h2>
          </div>
          <button onClick={dismiss} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-6 pt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#c9a84c]" : "bg-gray-100"}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-4">
            <Icon className="w-7 h-7 text-[#c9a84c]" />
          </div>
          <h3 className="font-heading text-lg font-bold text-[#0f1729] mb-2">{current.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{current.desc}</p>

          <div className="flex gap-3">
            <Link
              href={current.action.href}
              onClick={step === STEPS.length - 1 ? dismiss : undefined}
              className="flex-1 bg-[#c9a84c] hover:bg-[#e7b743] text-white font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {current.action.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm rounded-xl transition-colors"
              >
                Sonraki
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm rounded-xl transition-colors flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Tamam
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        <div className="px-6 pb-5 text-center">
          <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Şimdi atla
          </button>
        </div>
      </div>
    </div>
  );
}
