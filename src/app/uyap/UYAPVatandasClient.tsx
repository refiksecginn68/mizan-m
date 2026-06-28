"use client";

import { useState, useEffect } from "react";
import {
  Calendar, FileText, AlertCircle, Info, Lock,
  Eye, EyeOff, Loader2, MessageSquare, Scale,
  ChevronRight, Clock, RefreshCw, Building2, CheckCircle,
} from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";

interface DosyaBilgisi {
  esasNo: string;
  mahkeme: string;
  mahkemeAdi: string;
  davaciAdi: string;
  davaliAdi: string;
  davaTuru: string;
  acilisTarihi: string;
  durumu: string;
  hakim: string;
  durusmalar: Array<{ tarih: string; saat: string; salon: string; hakim: string; islem: string }>;
  sonIslemler: Array<{ tarih: string; aciklama: string }>;
}

interface SavedFile {
  id: string;
  esas_no: string;
  mahkeme_adi: string;
  dava_turu: string;
  durumu: string;
  acilis_tarihi: string;
  dosya_json: DosyaBilgisi;
}

interface Props {
  credits: number;
}

type Step = "giris" | "dosyalar" | "detay" | "asistan";

export default function UYAPVatandasClient({ credits }: Props) {
  const [step, setStep] = useState<Step>("giris");
  const [tcKimlik, setTcKimlik] = useState("");
  const [uyapSifre, setUyapSifre] = useState("");
  const [showSifre, setShowSifre] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [dosyalar, setDosyalar] = useState<DosyaBilgisi[]>([]);
  const [, setSavedFiles] = useState<SavedFile[]>([]);
  const [selectedDosya, setSelectedDosya] = useState<DosyaBilgisi | null>(null);
  const [caseContext, setCaseContext] = useState("");
  const [fetchingExisting, setFetchingExisting] = useState(true);

  // Daha önce kaydedilmiş dosyalar varsa giris adımını atla
  useEffect(() => {
    fetch("/api/vatandas/uyap/dosyalar")
      .then((r) => r.json())
      .then((d) => {
        if (d.files && d.files.length > 0) {
          setSavedFiles(d.files);
          setDosyalar(d.files.map((f: SavedFile) => f.dosya_json));
          setStep("dosyalar");
        }
      })
      .catch(() => null)
      .finally(() => setFetchingExisting(false));
  }, []);

  const handleLogin = async () => {
    if (!tcKimlik || tcKimlik.length !== 11) {
      setLoginError("Geçerli TC kimlik no girin (11 hane)");
      return;
    }
    if (!uyapSifre) {
      setLoginError("UYAP şifrenizi girin");
      return;
    }
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/vatandas/uyap/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tcKimlik, uyapSifre }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoginError(json.error || "Giriş başarısız");
      } else {
        setDosyalar(json.files);
        // Kayıtlı dosyaları yenile
        const docsRes = await fetch("/api/vatandas/uyap/dosyalar");
        const docsJson = await docsRes.json();
        if (docsJson.files) setSavedFiles(docsJson.files);
        setStep("dosyalar");
      }
    } catch {
      setLoginError("Bağlantı hatası");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSelectDosya = (dosya: DosyaBilgisi) => {
    setSelectedDosya(dosya);
    const ctx = `UYAP Dosyası — Esas No: ${dosya.esasNo}, Mahkeme: ${dosya.mahkemeAdi}, Dava Türü: ${dosya.davaTuru}, Davacı: ${dosya.davaciAdi}, Davalı: ${dosya.davaliAdi}, Durum: ${dosya.durumu}`;
    setCaseContext(ctx);
    setStep("detay");
  };

  const handleYenidenSorgula = () => {
    setDosyalar([]);
    setSavedFiles([]);
    setTcKimlik("");
    setUyapSifre("");
    setStep("giris");
  };

  const STEPS = [
    { id: "giris", label: "Giriş" },
    { id: "dosyalar", label: "Dosyalarım" },
    { id: "detay", label: "Dosya" },
    { id: "asistan", label: "AI İstişare" },
  ];
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  if (fetchingExisting) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Adım göstergesi */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i, arr) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 flex-1 ${i > 0 ? "justify-center" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step === s.id
                  ? "bg-primary text-white"
                  : stepIndex > i
                  ? "bg-success text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {stepIndex > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`font-body text-xs hidden sm:block ${step === s.id ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Uyarı */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="font-body text-xs text-blue-700">
          UYAP Vatandaş Portalı kimlik bilgilerinizle giriş yapın. Mahkeme dosyalarınız sisteme otomatik entegre edilir. Demo modunda örnek veriler gösterilir.
        </p>
      </div>

      {/* ADIM 1: Giriş */}
      {step === "giris" && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-primary">UYAP Vatandaş Girişi</h2>
              <p className="font-body text-sm text-muted-foreground">TC kimliğinizle mahkeme dosyalarınıza erişin</p>
            </div>
          </div>
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                TC Kimlik No <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                maxLength={11}
                value={tcKimlik}
                onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, ""))}
                placeholder="11 haneli TC kimlik no"
                className="input-field font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                UYAP Şifresi <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSifre ? "text" : "password"}
                  value={uyapSifre}
                  onChange={(e) => setUyapSifre(e.target.value)}
                  placeholder="UYAP vatandaş portal şifresi"
                  className="input-field pr-12"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowSifre(!showSifre)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSifre ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {loginError && (
              <p className="font-body text-sm text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {loginError}
              </p>
            )}
            <button
              onClick={handleLogin}
              disabled={loginLoading || !tcKimlik || !uyapSifre}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Dosyalar Yükleniyor...</>
              ) : (
                <><Building2 className="w-4 h-4" /> Dosyalarıma Eriş</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ADIM 2: Dosyalar Listesi */}
      {step === "dosyalar" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-primary">Mahkeme Dosyalarım</h2>
              <p className="font-body text-sm text-muted-foreground">{dosyalar.length} dosya sisteme entegre edildi</p>
            </div>
            <button
              onClick={handleYenidenSorgula}
              className="btn-outline text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Yeniden Bağlan
            </button>
          </div>

          {dosyalar.length === 0 ? (
            <div className="card text-center py-12 border-2 border-dashed border-border">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-heading text-base font-semibold text-primary">Dosya bulunamadı</p>
              <p className="font-body text-sm text-muted-foreground mt-1">UYAP&apos;ta aktif mahkeme dosyanız görünmüyor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dosyalar.map((dosya) => {
                const yaklasanDurusma = dosya.durusmalar?.[0];
                return (
                  <button
                    key={dosya.esasNo}
                    onClick={() => handleSelectDosya(dosya)}
                    className="card w-full text-left hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Scale className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{dosya.esasNo}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-body ${
                            dosya.durumu === "Devam Ediyor"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>{dosya.durumu}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-body bg-blue-100 text-blue-800">Demo</span>
                        </div>
                        <p className="font-heading text-base font-bold text-primary truncate">{dosya.davaTuru}</p>
                        <p className="font-body text-sm text-muted-foreground truncate">{dosya.mahkemeAdi}</p>
                        {yaklasanDurusma && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Calendar className="w-3.5 h-3.5 text-accent" />
                            <p className="font-body text-xs text-accent font-medium">
                              Duruşma: {new Date(yaklasanDurusma.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} — {yaklasanDurusma.saat}
                            </p>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADIM 3: Dosya Detayı */}
      {step === "detay" && selectedDosya && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("dosyalar")} className="btn-outline text-sm">
              ← Dosyalara Dön
            </button>
            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {selectedDosya.esasNo}
            </span>
          </div>

          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-body ${
                    selectedDosya.durumu === "Devam Ediyor" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}>{selectedDosya.durumu}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-body bg-blue-100 text-blue-800">Demo</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-primary">{selectedDosya.davaTuru}</h3>
                <p className="font-body text-sm text-muted-foreground">{selectedDosya.mahkemeAdi}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {[
                { label: "Davacı", value: selectedDosya.davaciAdi },
                { label: "Davalı", value: selectedDosya.davaliAdi },
                { label: "Hakim", value: selectedDosya.hakim },
                { label: "Açılış Tarihi", value: new Date(selectedDosya.acilisTarihi).toLocaleDateString("tr-TR") },
              ].map((item) => (
                <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                  <p className="font-body text-xs text-muted-foreground mb-0.5">{item.label}</p>
                  <p className="font-body text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {selectedDosya.durusmalar?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-heading text-sm font-bold text-primary mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Yaklaşan Duruşmalar
                </h4>
                <div className="space-y-2">
                  {selectedDosya.durusmalar.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                      <div>
                        <p className="font-body text-sm font-medium">{d.islem}</p>
                        <p className="font-body text-xs text-muted-foreground">{d.salon}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-body text-sm font-semibold text-primary">
                          {new Date(d.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">{d.saat}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDosya.sonIslemler?.length > 0 && (
              <div>
                <h4 className="font-heading text-sm font-bold text-primary mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Son İşlemler
                </h4>
                <div className="space-y-2">
                  {selectedDosya.sonIslemler.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      <p className="font-body text-sm flex-1">{item.aciklama}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {new Date(item.tarih).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI İstişare kartı */}
          <div className="card border-2 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Scale className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-base font-bold text-primary">AI ile İstişare Et</h3>
                <p className="font-body text-sm text-muted-foreground">
                  Bu dosya hakkında hukuki bilgi alın, süreçleri öğrenin.
                </p>
              </div>
              <button
                onClick={() => setStep("asistan")}
                className="btn-primary flex items-center gap-2 flex-shrink-0"
              >
                <MessageSquare className="w-4 h-4" /> Başlat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADIM 4: AI Asistan */}
      {step === "asistan" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("detay")} className="btn-outline text-sm">
              ← Dosyaya Dön
            </button>
            {selectedDosya && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {selectedDosya.esasNo}
                </span>
                <span className="font-body text-sm text-muted-foreground">{selectedDosya.mahkemeAdi}</span>
              </div>
            )}
          </div>

          <div className="card p-0 overflow-hidden" style={{ height: "600px" }}>
            <ChatWindow
              userType="vatandas"
              creditBalance={credits}
              caseContext={caseContext}
              placeholder="Dosyanız hakkında soru sorun..."
            />
          </div>

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-amber-700">
              ⚠️ AI asistan hukuki bilgi sunar, hukuki tavsiye niteliği taşımaz. Durumunuz için bir avukata danışın.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
