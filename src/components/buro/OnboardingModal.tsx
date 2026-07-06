"use client";

import { useState, useMemo } from "react";
import { X, Sparkles, UserPlus, Calendar, ArrowRight, ArrowLeft, CheckCircle, Loader2, Search, ChevronDown } from "lucide-react";
import {
  completeOnboardingAction,
  saveSpecializationsAction,
  addFirstClientAction,
} from "@/lib/actions/onboarding";

const UZMANLIK_ALANLARI = [
  "Ceza Hukuku",
  "Boşanma/Aile Hukuku",
  "İş Hukuku",
  "Ticaret Hukuku",
  "Gayrimenkul Hukuku",
  "İcra & İflas Hukuku",
  "İdare Hukuku",
  "Tüketici Hukuku",
  "Miras Hukuku",
  "Sigorta Hukuku",
  "KVKK / Veri Koruma",
  "Sağlık Hukuku",
  "Fikri Mülkiyet Hukuku",
  "Vergi Hukuku",
];

const TUMU_OPTION = "Hepsi";

const BAROLAR = [
  "Adana Barosu", "Adıyaman Barosu", "Afyonkarahisar Barosu", "Ağrı Barosu",
  "Aksaray Barosu", "Amasya Barosu", "Ankara Barosu", "Antalya Barosu",
  "Ardahan Barosu", "Artvin Barosu", "Aydın Barosu", "Balıkesir Barosu",
  "Bartın Barosu", "Batman Barosu", "Bayburt Barosu", "Bilecik Barosu",
  "Bingöl Barosu", "Bitlis Barosu", "Bolu Barosu", "Burdur Barosu",
  "Bursa Barosu", "Çanakkale Barosu", "Çankırı Barosu", "Çorum Barosu",
  "Denizli Barosu", "Diyarbakır Barosu", "Düzce Barosu", "Edirne Barosu",
  "Elazığ Barosu", "Erzincan Barosu", "Erzurum Barosu", "Eskişehir Barosu",
  "Gaziantep Barosu", "Giresun Barosu", "Gümüşhane Barosu", "Hakkari Barosu",
  "Hatay Barosu", "Iğdır Barosu", "Isparta Barosu", "İstanbul Barosu",
  "İzmir Barosu", "Kahramanmaraş Barosu", "Karabük Barosu", "Karaman Barosu",
  "Kars Barosu", "Kastamonu Barosu", "Kayseri Barosu", "Kilis Barosu",
  "Kırıkkale Barosu", "Kırklareli Barosu", "Kırşehir Barosu", "Kocaeli Barosu",
  "Konya Barosu", "Kütahya Barosu", "Malatya Barosu", "Manisa Barosu",
  "Mardin Barosu", "Mersin Barosu", "Muğla Barosu", "Muş Barosu",
  "Nevşehir Barosu", "Niğde Barosu", "Ordu Barosu", "Osmaniye Barosu",
  "Rize Barosu", "Sakarya Barosu", "Samsun Barosu", "Siirt Barosu",
  "Sinop Barosu", "Sivas Barosu", "Şanlıurfa Barosu", "Şırnak Barosu",
  "Tekirdağ Barosu", "Tokat Barosu", "Trabzon Barosu", "Tunceli Barosu",
  "Uşak Barosu", "Van Barosu", "Yalova Barosu", "Yozgat Barosu",
  "Zonguldak Barosu",
];

function BaroDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    BAROLAR.filter((b) => b.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field text-sm w-full flex items-center justify-between"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || "Baro seçin..."}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Baro ara..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[min(12rem,35dvh)] overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
            >
              — Baro Seçin —
            </button>
            {filtered.map((baro) => (
              <button
                key={baro}
                type="button"
                onClick={() => { onChange(baro); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  value === baro
                    ? "bg-[#0f1729] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {baro}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-400">Sonuç bulunamadı</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingModal() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Adım 1
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [barCity, setBarCity] = useState("");

  // Adım 2
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSkipped, setClientSkipped] = useState(false);

  async function markDone() {
    setLoading(true);
    await completeOnboardingAction();
    window.location.reload();
  }

  async function handleStep1Next() {
    setLoading(true);
    await saveSpecializationsAction({ specializations: selectedAreas, bar_city: barCity });
    setLoading(false);
    setStep(1);
  }

  async function handleStep2Next() {
    if (clientName.trim() && !clientSkipped) {
      setLoading(true);
      await addFirstClientAction({ full_name: clientName.trim(), phone: clientPhone.trim() });
      setLoading(false);
    }
    setStep(2);
  }

  function toggleArea(area: string) {
    if (area === TUMU_OPTION) {
      setSelectedAreas(
        selectedAreas.length === UZMANLIK_ALANLARI.length ? [] : [...UZMANLIK_ALANLARI]
      );
      return;
    }
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  const allSelected = selectedAreas.length === UZMANLIK_ALANLARI.length;

  const steps = [
    { icon: Sparkles, title: "Sizi Tanıyalım" },
    { icon: UserPlus, title: "İlk Müvekkilinizi Ekleyin" },
    { icon: Calendar, title: "Takvimi Bağlayın" },
  ];

  const StepIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col max-h-[90dvh]">

        {/* Header */}
        <div className="bg-[#0f1729] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
              Adım {step + 1} / {steps.length}
            </p>
            <h2 className="font-heading text-xl font-bold text-white mt-0.5">Büronuzu Kurun</h2>
          </div>
          <button
            onClick={markDone}
            disabled={loading}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#c9a84c]" : "bg-gray-100"}`}
            />
          ))}
        </div>

        {/* Content — dar ekranda taşmayı önlemek için iç scroll */}
        <div className="px-6 py-6 flex-1 overflow-y-auto min-h-0">
          <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-4">
            <StepIcon className="w-6 h-6 text-[#c9a84c]" />
          </div>
          <h3 className="font-heading text-lg font-bold text-[#0f1729] mb-1">{steps[step].title}</h3>

          {/* ── ADIM 1: Uzmanlık Alanları + Baro ── */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                MizanAI size uzmanlık alanlarınıza göre kişiselleştirilmiş yanıtlar verecek.
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Hepsi butonu */}
                <button
                  type="button"
                  onClick={() => toggleArea(TUMU_OPTION)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-semibold ${
                    allSelected
                      ? "bg-[#c9a84c] text-white border-[#c9a84c]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#c9a84c]"
                  }`}
                >
                  {TUMU_OPTION}
                </button>
                {UZMANLIK_ALANLARI.map((alan) => (
                  <button
                    key={alan}
                    type="button"
                    onClick={() => toggleArea(alan)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                      selectedAreas.includes(alan)
                        ? "bg-[#0f1729] text-white border-[#0f1729]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#0f1729]"
                    }`}
                  >
                    {alan}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Bağlı Olduğunuz Baro <span className="font-normal text-gray-400">(opsiyonel)</span>
                </label>
                <BaroDropdown value={barCity} onChange={setBarCity} />
              </div>
            </div>
          )}

          {/* ── ADIM 2: İlk Müvekkil ── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                İlk müvekkilinizi ekleyin. İstersen bu adımı atlayabilirsin.
              </p>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Ad Soyad</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="Ahmet Yılmaz"
                  value={clientName}
                  onChange={(e) => { setClientName(e.target.value); setClientSkipped(false); }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Telefon <span className="font-normal text-gray-400">(opsiyonel)</span>
                </label>
                <input
                  type="tel"
                  className="input-field text-sm"
                  placeholder="0555 123 45 67"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── ADIM 3: Google Takvim ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Google Takvimi bağlayarak duruşma ve toplantılarınızı otomatik senkronize edin.
              </p>
              <a
                href="/api/google-calendar/auth"
                className="flex items-center justify-center gap-2 w-full bg-[#c9a84c] hover:bg-[#e7b743] text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Google Takvimi Bağla
              </a>
              <p className="text-xs text-gray-400 text-center">
                Takvim bağlantısı sonrası bu sayfaya geri dönersiniz.
              </p>
            </div>
          )}
        </div>

        {/* Footer butonlar */}
        <div className="px-6 pb-6 pt-3 flex items-center justify-between gap-3 flex-shrink-0 border-t border-gray-50">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0 || loading}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {step < steps.length - 1 && (
              <button
                onClick={() => {
                  if (step === 1) setClientSkipped(true);
                  setStep((s) => s + 1);
                }}
                disabled={loading}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-2"
              >
                Şimdi Atla
              </button>
            )}

            {step === 0 && (
              <button
                onClick={handleStep1Next}
                disabled={loading}
                className="flex items-center gap-2 bg-[#0f1729] hover:bg-[#1a2744] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>İleri</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
            {step === 1 && (
              <button
                onClick={handleStep2Next}
                disabled={loading}
                className="flex items-center gap-2 bg-[#0f1729] hover:bg-[#1a2744] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>{clientName.trim() ? "Ekle ve Devam" : "Devam"}</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
            {step === 2 && (
              <button
                onClick={markDone}
                disabled={loading}
                className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e7b743] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /><span>Tamam, Başlayalım!</span></>}
              </button>
            )}
          </div>
        </div>

        {step === steps.length - 1 && (
          <div className="px-6 pb-5 text-center -mt-2">
            <button
              onClick={markDone}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Şimdi Atla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
