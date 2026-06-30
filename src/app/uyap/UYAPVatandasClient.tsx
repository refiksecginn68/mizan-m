"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar, FileText, AlertCircle, Info, Lock,
  Eye, EyeOff, Loader2, MessageSquare, Scale,
  ChevronRight, Clock, RefreshCw, Building2, CheckCircle,
  Shield, ExternalLink, Upload, X, Plus,
} from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";

/* ------------------------------------------------------------------ */
/* Tipler                                                               */
/* ------------------------------------------------------------------ */

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

interface UploadedDoc {
  id: string;
  name: string;
}

interface Props {
  credits: number;
}

type Step = "giris" | "dosyalar" | "detay" | "asistan";
type UploadStatus = "idle" | "dragging" | "uploading" | "success" | "error";

/* ------------------------------------------------------------------ */
/* Sürükle-bırak UYAP Belge Yükleme bileşeni                          */
/* ------------------------------------------------------------------ */

function UYAPBelgeYukle({ onUploaded }: { onUploaded: (doc: UploadedDoc) => void }) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { setError("Dosya 20 MB'ı aşamaz"); setStatus("error"); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { setError("Sadece PDF, JPG veya PNG yükleyebilirsiniz"); setStatus("error"); return; }

    setFileName(file.name);
    setStatus("uploading");
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/vatandas/uyap/belge-yukle", { method: "POST", body: fd });
      const json = await res.json() as { success?: boolean; documentId?: string; error?: string };

      if (!res.ok || !json.success) {
        setError(json.error ?? "Yükleme başarısız");
        setStatus("error");
        return;
      }

      setStatus("success");
      onUploaded({ id: json.documentId!, name: file.name });
    } catch {
      setError("Bağlantı hatası");
      setStatus("error");
    }
  }, [onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setStatus("idle");
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const reset = () => { setStatus("idle"); setError(""); setFileName(""); };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setStatus("dragging"); }}
        onDragLeave={() => setStatus(s => s === "dragging" ? "idle" : s)}
        onDrop={onDrop}
        onClick={() => status === "idle" || status === "error" ? fileRef.current?.click() : undefined}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          status === "dragging"
            ? "border-accent bg-accent/5 scale-[1.01]"
            : status === "success"
            ? "border-green-400 bg-green-50 cursor-default"
            : status === "uploading"
            ? "border-primary/40 bg-primary/5 cursor-wait"
            : "border-border hover:border-accent/50 hover:bg-accent/5 cursor-pointer"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />

        {status === "uploading" && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="font-body text-sm text-primary font-medium">Yükleniyor...</p>
            <p className="font-body text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <p className="font-body text-sm text-green-700 font-medium">Belge yüklendi!</p>
            <p className="font-body text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</p>
            <button onClick={(e) => { e.stopPropagation(); reset(); }} className="font-body text-xs text-accent hover:underline mt-1">
              Başka belge yükle
            </button>
          </div>
        )}

        {(status === "idle" || status === "dragging" || status === "error") && (
          <div className="flex flex-col items-center gap-2">
            <Upload className={`w-8 h-8 ${status === "dragging" ? "text-accent" : "text-muted-foreground"}`} />
            <p className="font-body text-sm font-medium text-primary">
              {status === "dragging" ? "Bırakın!" : "UYAP belgesini buraya sürükleyin"}
            </p>
            <p className="font-body text-xs text-muted-foreground">veya tıklayarak seçin · PDF, JPG, PNG · maks. 20 MB</p>
          </div>
        )}
      </div>

      {status === "error" && error && (
        <div className="flex items-center gap-2 mt-2 text-danger text-xs font-body">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* UYAP Senkronizasyon paneli (buton + açıklama + upload)             */
/* ------------------------------------------------------------------ */

function UYAPSenkronPanel({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(!collapsed);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const handleUploaded = (doc: UploadedDoc) => {
    setUploadedDocs((prev) => [doc, ...prev]);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Başlık — collapsed modda toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-body text-sm font-semibold text-primary">
            UYAP Vatandaş Portalı ile Senkronize Et
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* Açıklama */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-blue-700 leading-relaxed">
              UYAP&apos;a giriş yaptıktan sonra dosyalarınızı PDF olarak indirin ve aşağıya yükleyin. Belgeler otomatik olarak dosyalarınıza eklenir ve AI asistan ile istişare edebilirsiniz.
              <br />
              <span className="text-blue-500 mt-1 block">
                Gerçek API entegrasyonu onay sürecinde — şimdilik manuel köprü.
              </span>
            </p>
          </div>

          {/* UYAP Portalı Aç Butonu */}
          <a
            href="https://vatandas.uyap.gov.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors font-body text-sm font-semibold text-primary"
          >
            <Building2 className="w-4 h-4" />
            UYAP Vatandaş Portalını Aç
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          {/* Adımlar */}
          <div className="space-y-1.5">
            {[
              "UYAP Vatandaş Portalı'na T.C. kimliğinizle giriş yapın",
              "\"Dosya Sorgula\" menüsünden dava dosyanıza ulaşın",
              "Belgeleri PDF olarak indirin",
              "İndirdiğiniz PDF'leri aşağıya sürükleyip bırakın",
            ].map((adim, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="font-body text-xs text-foreground">{adim}</p>
              </div>
            ))}
          </div>

          {/* Upload alanı */}
          <UYAPBelgeYukle onUploaded={handleUploaded} />

          {/* Yüklenen belgeler listesi */}
          {uploadedDocs.length > 0 && (
            <div className="space-y-2">
              <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Bu oturumda yüklenen belgeler
              </p>
              {uploadedDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <p className="font-body text-xs text-green-800 truncate flex-1">{doc.name}</p>
                  <a
                    href={`/asistan?doc=${doc.id}`}
                    className="font-body text-xs text-accent hover:underline whitespace-nowrap"
                  >
                    AI ile analiz →
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="font-body text-xs text-muted-foreground">
              Giriş bilgilerinizi görmüyor veya saklamıyoruz. Yalnızca yüklediğiniz belgeler sisteme kaydedilir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ana bileşen                                                          */
/* ------------------------------------------------------------------ */

export default function UYAPVatandasClient({ credits }: Props) {
  const [step, setStep] = useState<Step>("giris");
  const [tcKimlik, setTcKimlik] = useState("");
  const [eDevletSifre, setEDevletSifre] = useState("");
  const [showSifre, setShowSifre] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [dosyalar, setDosyalar] = useState<DosyaBilgisi[]>([]);
  const [, setSavedFiles] = useState<SavedFile[]>([]);
  const [selectedDosya, setSelectedDosya] = useState<DosyaBilgisi | null>(null);
  const [caseContext, setCaseContext] = useState("");
  const [fetchingExisting, setFetchingExisting] = useState(true);
  const [showBelgePanel, setShowBelgePanel] = useState(false);

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
    if (!tcKimlik || tcKimlik.length !== 11) { setLoginError("Geçerli TC kimlik no girin (11 hane)"); return; }
    if (!eDevletSifre) { setLoginError("e-Devlet şifrenizi girin"); return; }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/vatandas/uyap/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tcKimlik, uyapSifre: eDevletSifre }),
      });
      const json = await res.json();
      if (!res.ok) { setLoginError(json.error || "Giriş başarısız"); }
      else {
        setDosyalar(json.files);
        const docsRes = await fetch("/api/vatandas/uyap/dosyalar");
        const docsJson = await docsRes.json();
        if (docsJson.files) setSavedFiles(docsJson.files);
        setStep("dosyalar");
      }
    } catch { setLoginError("Bağlantı hatası"); }
    finally { setLoginLoading(false); }
  };

  const handleSelectDosya = (dosya: DosyaBilgisi) => {
    setSelectedDosya(dosya);
    const ctx = `UYAP Dosyası — Esas No: ${dosya.esasNo}, Mahkeme: ${dosya.mahkemeAdi}, Dava Türü: ${dosya.davaTuru}, Davacı: ${dosya.davaciAdi}, Davalı: ${dosya.davaliAdi}, Durum: ${dosya.durumu}`;
    setCaseContext(ctx);
    setStep("detay");
  };

  const handleYenidenSorgula = () => {
    setDosyalar([]); setSavedFiles([]); setTcKimlik(""); setEDevletSifre(""); setStep("giris");
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
                step === s.id ? "bg-primary text-white" : stepIndex > i ? "bg-success text-white" : "bg-muted text-muted-foreground"
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

      {/* ADIM 1: Giriş */}
      {step === "giris" && (
        <div className="space-y-4">
          {/* e-Devlet Giriş Kartı */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#c0392b]/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#c0392b]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-heading text-lg font-bold text-primary">e-Devlet ile Giriş</span>
                  <span className="bg-[#c0392b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">e-devlet</span>
                </div>
                <p className="font-body text-sm text-muted-foreground">UYAP Vatandaş Portalı — TC kimliğinizle mahkeme dosyalarınıza erişin</p>
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
                  e-Devlet Şifresi <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSifre ? "text" : "password"}
                    value={eDevletSifre}
                    onChange={(e) => setEDevletSifre(e.target.value)}
                    placeholder="e-Devlet şifreniz"
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
                disabled={loginLoading || !tcKimlik || !eDevletSifre}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-body font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: loginLoading || !tcKimlik || !eDevletSifre ? "#9ca3af" : "#c0392b" }}
              >
                {loginLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Dosyalar Yükleniyor...</>
                ) : (
                  <><Shield className="w-4 h-4" /> e-Devlet ile Dosyalarıma Eriş</>
                )}
              </button>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <p className="font-body text-xs text-muted-foreground">256-bit SSL şifreli bağlantı. Bilgileriniz saklanmaz.</p>
              </div>
            </div>
          </div>

          {/* Ayırıcı */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 font-body text-xs text-muted-foreground">veya</span>
            </div>
          </div>

          {/* UYAP Senkronizasyon Paneli */}
          <UYAPSenkronPanel collapsed={false} />
        </div>
      )}

      {/* ADIM 2: Dosyalar */}
      {step === "dosyalar" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-primary">Mahkeme Dosyalarım</h2>
              <p className="font-body text-sm text-muted-foreground">{dosyalar.length} dosya sisteme entegre edildi</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBelgePanel((v) => !v)}
                className="btn-outline text-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Belge Ekle
              </button>
              <button onClick={handleYenidenSorgula} className="btn-outline text-sm flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" /> Yeniden Bağlan
              </button>
            </div>
          </div>

          {/* Belge ekleme paneli — toggle */}
          {showBelgePanel && (
            <div className="relative">
              <button
                onClick={() => setShowBelgePanel(false)}
                className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
              <UYAPSenkronPanel collapsed={false} />
            </div>
          )}

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
                            dosya.durumu === "Devam Ediyor" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }`}>{dosya.durumu}</span>
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
            <button onClick={() => setStep("dosyalar")} className="btn-outline text-sm">← Dosyalara Dön</button>
            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">{selectedDosya.esasNo}</span>
          </div>

          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-body ${
                    selectedDosya.durumu === "Devam Ediyor" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}>{selectedDosya.durumu}</span>
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

          {/* AI İstişare */}
          <div className="card border-2 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Scale className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-base font-bold text-primary">AI ile İstişare Et</h3>
                <p className="font-body text-sm text-muted-foreground">Bu dosya hakkında hukuki bilgi alın, süreçleri öğrenin.</p>
              </div>
              <button onClick={() => setStep("asistan")} className="btn-primary flex items-center gap-2 flex-shrink-0">
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
            <button onClick={() => setStep("detay")} className="btn-outline text-sm">← Dosyaya Dön</button>
            {selectedDosya && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">{selectedDosya.esasNo}</span>
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
