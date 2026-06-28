"use client";

import { useState } from "react";
import { FileText, ChevronRight, ChevronLeft, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type DilekceType =
  | "ihtarname"
  | "sikayet_dilekce"
  | "itiraz_dilekce"
  | "is_tazminat"
  | "kira_tahliye"
  | "tuketici_sikayet"
  | "nafaka"
  | "vekaletname_talep";

interface DilekceTypeOption {
  value: DilekceType;
  label: string;
  desc: string;
  credit: number;
  fields: FieldDef[];
}

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "date";
  placeholder: string;
  required?: boolean;
}

const DILEKCE_TYPES: DilekceTypeOption[] = [
  {
    value: "ihtarname",
    label: "İhtarname",
    desc: "Borcun ödenmesi veya yükümlülüğün yerine getirilmesi için resmi uyarı",
    credit: 8,
    fields: [
      { key: "gonderen_ad", label: "Gönderen Ad Soyad", type: "text", placeholder: "Adınız Soyadınız", required: true },
      { key: "gonderen_adres", label: "Gönderen Adres", type: "textarea", placeholder: "Tam adresiniz", required: true },
      { key: "alici_ad", label: "Muhatap Ad/Unvan", type: "text", placeholder: "Karşı taraf adı", required: true },
      { key: "alici_adres", label: "Muhatap Adres", type: "textarea", placeholder: "Karşı taraf adresi", required: true },
      { key: "konu", label: "İhtarname Konusu", type: "text", placeholder: "Ör: Kira Borcunun Ödenmesi", required: true },
      { key: "aciklama", label: "Talep ve Açıklama", type: "textarea", placeholder: "Ne istediğinizi ve nedenini açıklayın...", required: true },
      { key: "sure", label: "Uyum Süresi", type: "text", placeholder: "Ör: 7 gün, 30 gün" },
    ],
  },
  {
    value: "sikayet_dilekce",
    label: "Şikayet Dilekçesi",
    desc: "Savcılık veya idari makamlara şikayet",
    credit: 8,
    fields: [
      { key: "sikayet_eden", label: "Şikayetçi Ad Soyad", type: "text", placeholder: "Adınız Soyadınız", required: true },
      { key: "sikayet_adres", label: "Şikayetçi Adres", type: "textarea", placeholder: "Adresiniz", required: true },
      { key: "sikayet_tc", label: "TC Kimlik No", type: "text", placeholder: "11 haneli TC kimlik" },
      { key: "sikayet_edilen", label: "Şikayet Edilen Kişi/Kurum", type: "text", placeholder: "Adı veya unvanı", required: true },
      { key: "olay_tarihi", label: "Olay Tarihi", type: "date", placeholder: "", required: true },
      { key: "olaylar", label: "Olayların Açıklaması", type: "textarea", placeholder: "Yaşananları kronolojik sırayla anlatın...", required: true },
      { key: "talep", label: "Talep", type: "textarea", placeholder: "Ne talep ediyorsunuz?" },
    ],
  },
  {
    value: "itiraz_dilekce",
    label: "İtiraz Dilekçesi",
    desc: "İdari karara veya mahkeme kararına itiraz",
    credit: 8,
    fields: [
      { key: "itiraz_eden", label: "İtiraz Eden Ad Soyad", type: "text", placeholder: "Adınız Soyadınız", required: true },
      { key: "itiraz_adres", label: "Adres", type: "textarea", placeholder: "Adresiniz", required: true },
      { key: "karar_no", label: "İtiraz Edilen Karar No / Tarih", type: "text", placeholder: "Ör: 2024/1234 sayılı, 01.01.2024 tarihli" },
      { key: "kurum", label: "Karar Veren Kurum", type: "text", placeholder: "Mahkeme veya idare adı", required: true },
      { key: "itiraz_gerekce", label: "İtiraz Gerekçesi", type: "textarea", placeholder: "Kararın neden hatalı olduğunu açıklayın...", required: true },
      { key: "talep", label: "Sonuç Talebi", type: "textarea", placeholder: "Ne talep ediyorsunuz?", required: true },
    ],
  },
  {
    value: "is_tazminat",
    label: "İş Tazminatı Talebi",
    desc: "Kıdem, ihbar veya işe iade talebi",
    credit: 8,
    fields: [
      { key: "isci_ad", label: "İşçi Ad Soyad", type: "text", placeholder: "Adınız Soyadınız", required: true },
      { key: "isyeri", label: "İşyeri/İşveren Adı", type: "text", placeholder: "İşverenin ticari unvanı", required: true },
      { key: "ise_giris", label: "İşe Giriş Tarihi", type: "date", placeholder: "", required: true },
      { key: "cikis_tarihi", label: "Çıkış Tarihi", type: "date", placeholder: "", required: true },
      { key: "ucret", label: "Son Brüt Ücret (TL)", type: "text", placeholder: "Ör: 25.000" },
      { key: "cikis_nedeni", label: "Çıkış Nedeni", type: "textarea", placeholder: "Nasıl ve neden işten ayrıldınız?", required: true },
      { key: "talepler", label: "Talep Edilen Tazminatlar", type: "textarea", placeholder: "Kıdem, ihbar, fazla mesai vb." },
    ],
  },
  {
    value: "kira_tahliye",
    label: "Kira Tahliye / İtiraz",
    desc: "Kiracı veya ev sahibi tarafı için kira uyuşmazlığı",
    credit: 8,
    fields: [
      { key: "taraf_ad", label: "Ad Soyad", type: "text", placeholder: "Adınız Soyadınız", required: true },
      { key: "taraf_pozisyon", label: "Tarafınız", type: "text", placeholder: "Kiracı mı, Ev Sahibi mi?", required: true },
      { key: "adres", label: "Kiralık Mülk Adresi", type: "textarea", placeholder: "Tam adres", required: true },
      { key: "kira_miktari", label: "Aylık Kira Miktarı (TL)", type: "text", placeholder: "Ör: 10.000" },
      { key: "kira_sozlesme_tarihi", label: "Kira Sözleşmesi Tarihi", type: "date", placeholder: "" },
      { key: "sorun", label: "Uyuşmazlık Konusu", type: "textarea", placeholder: "Sorunu ve talebinizi açıklayın...", required: true },
    ],
  },
  {
    value: "tuketici_sikayet",
    label: "Tüketici Şikayeti",
    desc: "Tüketici Hakem Heyeti veya mahkeme için şikayet",
    credit: 8,
    fields: [
      { key: "tuketici_ad", label: "Tüketici Ad Soyad", type: "text", placeholder: "Adınız Soyadınız", required: true },
      { key: "tuketici_adres", label: "Adres / İletişim", type: "textarea", placeholder: "Adresiniz ve telefon", required: true },
      { key: "firma", label: "Şikayet Edilen Firma", type: "text", placeholder: "Firma adı", required: true },
      { key: "urun_hizmet", label: "Ürün / Hizmet", type: "text", placeholder: "Ne satın aldınız?", required: true },
      { key: "tarih", label: "Alım Tarihi", type: "date", placeholder: "" },
      { key: "tutar", label: "Ödenen Tutar (TL)", type: "text", placeholder: "Ör: 5.000" },
      { key: "sorun", label: "Sorun ve Talep", type: "textarea", placeholder: "Yaşanan sorunu ve talebinizi açıklayın...", required: true },
    ],
  },
  {
    value: "nafaka",
    label: "Nafaka Talebi / İtiraz",
    desc: "Nafaka belirleme veya değiştirilmesi talebi",
    credit: 8,
    fields: [
      { key: "talep_eden", label: "Talep Eden Ad Soyad", type: "text", placeholder: "Adınız Soyadınız", required: true },
      { key: "diger_taraf", label: "Karşı Taraf Ad Soyad", type: "text", placeholder: "Eşinizin adı", required: true },
      { key: "cocuklar", label: "Çocuklar (varsa)", type: "text", placeholder: "İsim ve yaş bilgileri" },
      { key: "gelir_durumu", label: "Gelir Durumu", type: "textarea", placeholder: "Aylık geliriniz ve giderleriniz", required: true },
      { key: "mevcut_nafaka", label: "Mevcut Nafaka (varsa)", type: "text", placeholder: "Belirlenmiş tutar" },
      { key: "talep", label: "Talep ve Gerekçe", type: "textarea", placeholder: "Ne talep ediyorsunuz ve neden?", required: true },
    ],
  },
  {
    value: "vekaletname_talep",
    label: "Belge / Bilgi Talep Dilekçesi",
    desc: "Kurumdan belge, bilgi veya kayıt talep etme",
    credit: 8,
    fields: [
      { key: "talep_eden", label: "Talep Eden Ad Soyad", type: "text", placeholder: "Adınız Soyadınız", required: true },
      { key: "talep_adres", label: "Adres", type: "textarea", placeholder: "Adresiniz", required: true },
      { key: "kurum", label: "Talep Yapılan Kurum", type: "text", placeholder: "Kurum veya şirket adı", required: true },
      { key: "talep_konusu", label: "Talep Konusu", type: "textarea", placeholder: "Ne istiyorsunuz?", required: true },
      { key: "gecikme_gecmis", label: "Önceki Talepler (varsa)", type: "textarea", placeholder: "Daha önce talep ettiniz mi?" },
    ],
  },
];

type StepStatus = "type" | "fields" | "generating" | "done" | "error";

export default function DilekceWizard() {
  const [step, setStep] = useState<StepStatus>("type");
  const [selectedType, setSelectedType] = useState<DilekceTypeOption | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ text: string; pdfUrl?: string } | null>(null);
  const [genError, setGenError] = useState("");

  function handleTypeSelect(t: DilekceTypeOption) {
    setSelectedType(t);
    setFormData({});
    setErrors({});
    setStep("fields");
  }

  function validateFields(): boolean {
    const newErrors: Record<string, string> = {};
    selectedType?.fields.forEach((f) => {
      if (f.required && !formData[f.key]?.trim()) {
        newErrors[f.key] = "Bu alan zorunludur.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleGenerate() {
    if (!selectedType || !validateFields()) return;
    setStep("generating");
    setGenError("");

    try {
      const res = await fetch("/api/generate/dilekce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType.value, data: formData }),
      });

      const json = await res.json() as { text?: string; pdfUrl?: string; error?: string };

      if (!res.ok || json.error) {
        setGenError(json.error ?? "Üretim sırasında hata oluştu.");
        setStep("error");
        return;
      }

      setResult({ text: json.text ?? "", pdfUrl: json.pdfUrl });
      setStep("done");
    } catch {
      setGenError("Bağlantı hatası. Tekrar deneyin.");
      setStep("error");
    }
  }

  function copyText() {
    if (result?.text) navigator.clipboard.writeText(result.text);
  }

  return (
    <div>
      {/* Adım Göstergesi */}
      {step !== "type" && (
        <div className="flex items-center gap-2 mb-6 text-sm font-body text-muted-foreground">
          <button onClick={() => setStep("type")} className="hover:text-primary transition-colors">
            Tür Seç
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className={step === "fields" ? "text-primary font-medium" : ""}>Bilgileri Gir</span>
          <ChevronRight className="w-3 h-3" />
          <span className={step === "done" ? "text-primary font-medium" : ""}>Üretildi</span>
        </div>
      )}

      {/* ADIM 1: Tür Seçimi */}
      {step === "type" && (
        <div>
          <h2 className="font-heading text-lg font-bold text-primary mb-4">Dilekçe Türü Seçin</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {DILEKCE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTypeSelect(t)}
                className="card text-left hover:shadow-elevated hover:border-accent/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-primary group-hover:text-accent transition-colors">
                      {t.label}
                    </h3>
                    <p className="font-body text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </div>
                  <span className="legal-citation text-xs flex-shrink-0 ml-3">{t.credit} kredi</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ADIM 2: Form */}
      {step === "fields" && selectedType && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-primary">{selectedType.label}</h2>
            <button
              onClick={() => setStep("type")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Geri
            </button>
          </div>

          <div className="space-y-4">
            {selectedType.fields.map((field) => (
              <div key={field.key}>
                <label className="block font-body text-sm font-medium text-primary mb-1">
                  {field.label}
                  {field.required && <span className="text-danger ml-1">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={formData[field.key] ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    className={`input-field resize-y ${errors[field.key] ? "border-danger" : ""}`}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className={`input-field ${errors[field.key] ? "border-danger" : ""}`}
                  />
                )}
                {errors[field.key] && (
                  <p className="font-body text-xs text-danger mt-1">{errors[field.key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <p className="font-body text-sm text-muted-foreground">
              Bu işlem <span className="font-bold text-primary">{selectedType.credit} kredi</span> harcar.
            </p>
            <button onClick={handleGenerate} className="btn-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Dilekçe Üret
            </button>
          </div>
        </div>
      )}

      {/* Üretiliyor */}
      {step === "generating" && (
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 text-accent mx-auto mb-4 animate-spin" />
          <p className="font-heading text-lg text-primary mb-2">Dilekçeniz Hazırlanıyor</p>
          <p className="font-body text-sm text-muted-foreground">
            AI, hukuki içeriği oluşturuyor ve ilgili mevzuatı kontrol ediyor...
          </p>
        </div>
      )}

      {/* Hata */}
      {step === "error" && (
        <div className="text-center py-12">
          <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
          <p className="font-heading text-base text-primary mb-2">Hata Oluştu</p>
          <p className="font-body text-sm text-muted-foreground mb-4">{genError}</p>
          <button onClick={() => setStep("fields")} className="btn-outline">
            Tekrar Dene
          </button>
        </div>
      )}

      {/* ADIM 3: Sonuç */}
      {step === "done" && result && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <h2 className="font-heading text-lg font-bold text-primary">Dilekçeniz Hazır</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyText} className="btn-outline text-sm py-1.5 px-3">
                Kopyala
              </button>
              {result.pdfUrl && (
                <a href={result.pdfUrl} download className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  PDF İndir
                </a>
              )}
            </div>
          </div>

          {/* Metin Önizleme */}
          <div className="bg-white border border-border rounded-xl p-6 font-body text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
            {result.text}
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
            <p className="font-body text-xs text-muted-foreground">
              ⚠️ Bu dilekçe AI tarafından üretilmiştir. Göndermeden önce bir avukata inceletin.
              Mizanım, içeriğin hukuki doğruluğundan sorumlu değildir.
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => { setStep("type"); setSelectedType(null); setResult(null); }}
              className="btn-outline flex-1"
            >
              Yeni Dilekçe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
