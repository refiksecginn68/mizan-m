"use client";

import { useState } from "react";
import {
  Search, Calendar, FileText, Shield, AlertCircle,
  CheckCircle, Clock, Building2, User, Download,
  PlusCircle, Info, Loader2, Users, Puzzle,
} from "lucide-react";

interface Case {
  id: string;
  title: string;
  case_number?: string;
}

interface Client {
  id: string;
  name: string;
  tc_number?: string;
}

interface Durusma {
  tarih: string;
  saat: string;
  salon: string;
  hakim: string;
  islem: string;
}

interface DavaResult {
  esasNo: string;
  mahkeme: string;
  mahkemeAdi: string;
  davaciAdi: string;
  davaliAdi: string;
  davaTuru: string;
  acilisTarihi: string;
  durumu: string;
  hakim: string;
  katip?: string;
  durusmalar: Durusma[];
  sonIslemler: Array<{ tarih: string; aciklama: string }>;
}

const MAHKEMELER = [
  "Asliye Hukuk", "Asliye Ceza", "Sulh Hukuk", "Sulh Ceza",
  "İdare", "Vergi", "İş", "Aile", "Ticaret", "İcra", "Tüketici",
];

const DOC_TYPES = [
  { value: "dilekce", label: "Dilekçe" },
  { value: "savunma", label: "Savunma" },
  { value: "itiraz", label: "İtiraz" },
  { value: "beyan", label: "Beyan" },
];

const DEMO_DURUSMALAR = [
  { esasNo: "2024/1234", mahkeme: "3. Asliye Hukuk Mahkemesi", tarih: new Date(Date.now() + 3 * 24 * 3600 * 1000), saat: "09:30", hakim: "Hülya Kaya", salon: "2. Duruşma Salonu" },
  { esasNo: "2023/5678", mahkeme: "2. Asliye Ceza Mahkemesi", tarih: new Date(Date.now() + 7 * 24 * 3600 * 1000), saat: "14:00", hakim: "Ahmet Çelik", salon: "5. Duruşma Salonu" },
  { esasNo: "2024/910", mahkeme: "1. İş Mahkemesi", tarih: new Date(Date.now() + 12 * 24 * 3600 * 1000), saat: "10:30", hakim: "Fatma Arslan", salon: "3. Duruşma Salonu" },
];

const TABS = [
  { id: "sorgula", label: "Dosya Sorgula", icon: Search },
  { id: "muvekkil", label: "Müvekkil Entegrasyon", icon: Users },
  { id: "durusmalar", label: "Duruşmalarım", icon: Calendar },
  { id: "udf", label: "UDF Belgesi", icon: FileText },
  { id: "eimza", label: "E-İmza", icon: Shield },
];

// Vekalet giriş formu — createClientFromVekalet servisini çağırır
function VekaletForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    full_name: "", tc_no: "", phone: "", email: "",
    vekalet_no: "", dosya_no: "", vekalet_tarihi: "", noter: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Ad Soyad zorunludur"); return; }
    setLoading(true); setError(""); setSuccess(false);
    try {
      const res = await fetch("/api/buro/muvekkil/vekalet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { clientId?: string; alreadyExists?: boolean; error?: string };
      if (!res.ok) { setError(json.error ?? "Eklenemedi"); return; }
      setSuccess(true);
      setAlreadyExists(json.alreadyExists ?? false);
      setForm({ full_name: "", tc_no: "", phone: "", email: "", vekalet_no: "", dosya_no: "", vekalet_tarihi: "", noter: "", notes: "" });
      onSuccess();
    } catch { setError("Bağlantı hatası"); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Kişisel bilgiler */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm font-medium text-foreground block mb-1">
            Ad Soyad <span className="text-danger">*</span>
          </label>
          <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
            placeholder="Müvekkil ad soyad" className="input-field" />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-foreground block mb-1">TC Kimlik No</label>
          <input value={form.tc_no} onChange={(e) => set("tc_no", e.target.value.replace(/\D/g, ""))}
            maxLength={11} placeholder="11 haneli TC kimlik no" className="input-field font-mono" />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-foreground block mb-1">Telefon</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
            placeholder="+90 5xx xxx xx xx" className="input-field" />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-foreground block mb-1">E-posta</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
            placeholder="ornek@email.com" className="input-field" />
        </div>
      </div>

      {/* Vekalet bilgileri */}
      <div className="border-t border-border pt-4">
        <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Vekalet Bilgileri (İleride UYAP API ile otomatik doldurulacak)
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">Vekaletname No</label>
            <input value={form.vekalet_no} onChange={(e) => set("vekalet_no", e.target.value)}
              placeholder="Vekaletname numarası" className="input-field" />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">UYAP Dosya / Esas No</label>
            <input value={form.dosya_no} onChange={(e) => set("dosya_no", e.target.value)}
              placeholder="örn: 2024/1234" className="input-field" />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">Vekaletname Tarihi</label>
            <input type="date" value={form.vekalet_tarihi} onChange={(e) => set("vekalet_tarihi", e.target.value)}
              className="input-field" />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">Düzenleyen Noter</label>
            <input value={form.noter} onChange={(e) => set("noter", e.target.value)}
              placeholder="noter adı / şehri" className="input-field" />
          </div>
        </div>
      </div>

      <div>
        <label className="font-body text-sm font-medium text-foreground block mb-1">Notlar</label>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
          rows={2} placeholder="Ek notlar..." className="input-field resize-none" />
      </div>

      {error && (
        <p className="font-body text-sm text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
      {success && (
        <p className="font-body text-sm text-success flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {alreadyExists ? "Müvekkil zaten kayıtlıydı — bilgiler güncellendi." : "Müvekkil CRM'e eklendi!"}
        </p>
      )}

      <button type="submit" disabled={loading || !form.full_name.trim()}
        className="btn-primary flex items-center gap-2">
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Ekleniyor...</>
        ) : (
          <><PlusCircle className="w-4 h-4" /> CRM&apos;e Müvekkil Olarak Ekle</>
        )}
      </button>
    </form>
  );
}

export default function UYAPClient({ cases, clients }: { cases: Case[]; clients?: Client[] }) {
  const [activeTab, setActiveTab] = useState("sorgula");
  const [esasNo, setEsasNo] = useState("");
  const [mahkeme, setMahkeme] = useState("");
  const [loading, setLoading] = useState(false);
  const [sorguResult, setSorguResult] = useState<DavaResult | null>(null);
  const [sorguError, setSorguError] = useState("");
  const [durusmaFilter, setDurusmaFilter] = useState<"hafta" | "ay">("hafta");

  // Sisteme ekle
  const [addingToSystem, setAddingToSystem] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addClientId, setAddClientId] = useState("");

  // Müvekkil entegrasyon
  const [syncResults, setSyncResults] = useState<Array<{ esasNo: string; added: boolean }>>([]);

  const [udfDocType, setUdfDocType] = useState("dilekce");
  const [udfCaseId, setUdfCaseId] = useState("");
  const [udfContent, setUdfContent] = useState("");
  const [udfLoading, setUdfLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
  function showToast(text: string, type: "error" | "success" = "error") {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  }

  const handleSorgula = async () => {
    if (!esasNo.trim() || !mahkeme) return;
    setLoading(true);
    setSorguError("");
    setSorguResult(null);
    setAddSuccess(false);
    try {
      const res = await fetch("/api/buro/uyap/sorgula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ esasNo: esasNo.trim(), mahkeme }),
      });
      const json = await res.json();
      if (!res.ok) setSorguError(json.error || "Sorgu başarısız");
      else setSorguResult(json.data);
    } catch {
      setSorguError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleSistemeEkle = async () => {
    if (!sorguResult) return;
    setAddingToSystem(true);
    try {
      const res = await fetch("/api/buro/uyap/sisteme-ekle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          esasNo: sorguResult.esasNo,
          davaData: sorguResult,
          clientId: addClientId || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 4000);
      } else {
        setSorguError(json.error || "Eklenemedi");
      }
    } catch {
      setSorguError("Bağlantı hatası");
    } finally {
      setAddingToSystem(false);
    }
  };

  const handleUdfHazirla = async () => {
    if (!udfDocType || !udfContent.trim()) return;
    setUdfLoading(true);
    try {
      const res = await fetch("/api/buro/uyap/udf-hazirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: udfCaseId || undefined, docType: udfDocType, content: udfContent }),
      });
      if (!res.ok) {
        const json = await res.json();
        showToast(json.error || "UDF hazırlanamadı");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : "belge.udf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("İndirme sırasında hata oluştu");
    } finally {
      setUdfLoading(false);
    }
  };

  const filteredDurusmalar = DEMO_DURUSMALAR.filter((d) => {
    const diff = d.tarih.getTime() - Date.now();
    if (durusmaFilter === "hafta") return diff <= 7 * 24 * 3600 * 1000 && diff > 0;
    return diff <= 30 * 24 * 3600 * 1000 && diff > 0;
  });

  return (
    <div>
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toastMsg.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          {toastMsg.text}
        </div>
      )}
      {/* UYAP bağlantısı: Chrome eklentisi üzerinden */}
      <div className="flex items-start gap-3 rounded-lg p-4 mb-6 border bg-primary/5 border-primary/20">
        <Puzzle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-sm font-semibold text-primary">
            UYAP bağlantısı Chrome eklentisiyle yapılır
          </p>
          <p className="font-body text-xs mt-0.5 text-muted-foreground">
            Mizanım UYAP eklentisini kurup aşağıdaki karttan bağlantı kodunuzu alın; UYAP Avukat
            Portalı&apos;na kendi e-imzanızla girin ve <strong>Tümünü Mizanım&apos;a Aktar</strong> ile
            dosyalarınızı tek tıkla çekin. Mizanım UYAP şifrenizi veya kimlik bilgilerinizi saklamaz.
          </p>
        </div>
      </div>

      {/* Gizlilik / KVKK uyarısı */}
      <div className="flex items-start gap-3 rounded-lg p-4 mb-6 border bg-[#f8f9fa] border-gray-200">
        <Shield className="w-5 h-5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
        <p className="font-body text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Gizlilik hatırlatması:</strong>{" "}
          Mizanım, UYAP hesabınıza sizin yerinize giriş yapmaz; e-imza/mobil imza
          süreci tamamen sizin kontrolünüzdedir. Tarayıcı eklentisi yalnızca
          sizin açtığınız oturumda ekranda görünen dosya bilgilerini okur ve
          aktarır. UYAP şifreniz veya e-imza PIN&apos;iniz Mizanım tarafından
          istenmez, işlenmez ve depolanmaz. Aktarılan veriler 6698 sayılı KVKK
          kapsamındaki yükümlülüklere uygun şekilde yalnızca sizin hesabınızda
          saklanır.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body font-medium transition-all whitespace-nowrap flex-1 justify-center ${
              activeTab === id ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Müvekkil Entegrasyon Tab */}
      {activeTab === "muvekkil" && (
        <div className="space-y-5">

          {/* Eklenti bilgi notu */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-blue-800">
                Dosyaları otomatik çekmek için Chrome eklentisini kullanın
              </p>
              <p className="font-body text-xs text-blue-700 mt-0.5">
                Eklenti ile dosyaları aktardığınızda, taraf bilgilerindeki müvekkiliniz otomatik olarak CRM&apos;e
                eklenir ve dosyaya bağlanır. Eklentiyi kullanamıyorsanız, vekalet bilgilerini aşağıdan elle
                girerek müvekkil oluşturabilirsiniz.
              </p>
            </div>
          </div>

          {/* Vekalet Giriş Formu */}
          <div className="card">
            <h2 className="font-heading text-lg font-bold text-primary mb-1">Manuel Vekalet Girişi</h2>
            <p className="font-body text-sm text-muted-foreground mb-5">
              Vekalet aldığınız müvekkilin bilgilerini girin. CRM&apos;e otomatik müvekkil olarak eklenir.
            </p>

            <VekaletForm onSuccess={() => setSyncResults([{ esasNo: "–", added: true }])} />
          </div>

          {syncResults.length > 0 && syncResults[0].added && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-body text-sm font-semibold text-green-800">Müvekkil CRM&apos;e eklendi!</p>
                <p className="font-body text-xs text-green-700">
                  <a href="/buro/muvekkiller" className="underline font-medium">Müvekkiller sayfasında</a> görüntüleyebilirsiniz.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dosya Sorgula */}
      {activeTab === "sorgula" && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-heading text-lg font-bold text-primary mb-4">UYAP Dosya Sorgula</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                  Esas No <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={esasNo}
                  onChange={(e) => setEsasNo(e.target.value)}
                  placeholder="örn: 2024/1234"
                  className="input-field"
                  onKeyDown={(e) => e.key === "Enter" && handleSorgula()}
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                  Mahkeme <span className="text-danger">*</span>
                </label>
                <select value={mahkeme} onChange={(e) => setMahkeme(e.target.value)} className="input-field">
                  <option value="">Mahkeme seçin</option>
                  {MAHKEMELER.map((m) => (
                    <option key={m} value={m}>{m} Mahkemesi</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleSorgula}
              disabled={loading || !esasNo.trim() || !mahkeme}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sorgulanıyor...</>
              ) : (
                <><Search className="w-4 h-4" /> Sorgula</>
              )}
            </button>
          </div>

          {sorguError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <p className="font-body text-sm text-danger">{sorguError}</p>
            </div>
          )}

          {sorguResult && (
            <div className="card space-y-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {sorguResult.esasNo}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-body bg-green-100 text-green-800">
                      {sorguResult.durumu}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-body bg-amber-100 text-amber-800">Demo</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary">{sorguResult.davaTuru}</h3>
                  <p className="font-body text-sm text-muted-foreground">{sorguResult.mahkemeAdi}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {cases.length > 0 && (
                    <select
                      value={addClientId}
                      onChange={(e) => setAddClientId(e.target.value)}
                      className="input-field text-xs py-1.5 h-auto"
                    >
                      <option value="">Müvekkil seç (opsiyonel)</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={handleSistemeEkle}
                    disabled={addingToSystem || addSuccess}
                    className={`flex items-center gap-2 text-sm flex-shrink-0 ${addSuccess ? "btn-outline text-success border-success" : "btn-accent"}`}
                  >
                    {addingToSystem ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Ekleniyor...</>
                    ) : addSuccess ? (
                      <><CheckCircle className="w-4 h-4" /> Sisteme Eklendi!</>
                    ) : (
                      <><PlusCircle className="w-4 h-4" /> Sisteme Ekle</>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Davacı", value: sorguResult.davaciAdi, icon: User },
                  { label: "Davalı", value: sorguResult.davaliAdi, icon: User },
                  { label: "Hakim", value: sorguResult.hakim, icon: Building2 },
                  { label: "Açılış Tarihi", value: new Date(sorguResult.acilisTarihi).toLocaleDateString("tr-TR"), icon: Calendar },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/30 rounded-lg p-4">
                    <p className="font-body text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <item.icon className="w-3.5 h-3.5" /> {item.label}
                    </p>
                    <p className="font-body text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              {sorguResult.durusmalar.length > 0 && (
                <div>
                  <h4 className="font-heading text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Yaklaşan Duruşmalar
                  </h4>
                  <div className="space-y-2">
                    {sorguResult.durusmalar.map((d, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                        <div>
                          <p className="font-body text-sm font-medium text-foreground">{d.islem}</p>
                          <p className="font-body text-xs text-muted-foreground">{d.salon} · Hakim: {d.hakim}</p>
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

              {sorguResult.sonIslemler.length > 0 && (
                <div>
                  <h4 className="font-heading text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Son İşlemler
                  </h4>
                  <div className="space-y-2">
                    {sorguResult.sonIslemler.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                        <p className="font-body text-sm text-foreground flex-1">{item.aciklama}</p>
                        <p className="font-body text-xs text-muted-foreground flex-shrink-0">
                          {new Date(item.tarih).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Duruşmalarım */}
      {activeTab === "durusmalar" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {(["hafta", "ay"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDurusmaFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                  durusmaFilter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f === "hafta" ? "Bu Hafta" : "Bu Ay"}
              </button>
            ))}
            <span className="font-body text-xs text-muted-foreground ml-auto">Demo verisi</span>
          </div>

          {filteredDurusmalar.length === 0 ? (
            <div className="card text-center py-12 border-2 border-dashed border-border">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-heading text-base font-semibold text-primary">Duruşma bulunamadı</p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                {durusmaFilter === "hafta" ? "Bu hafta" : "Bu ay"} kayıtlı duruşma yok
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDurusmalar.map((d, i) => {
                const daysLeft = Math.ceil((d.tarih.getTime() - Date.now()) / (24 * 3600 * 1000));
                return (
                  <div key={i} className="card flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      daysLeft <= 3 ? "bg-red-100" : daysLeft <= 7 ? "bg-amber-100" : "bg-primary/10"
                    }`}>
                      <Calendar className={`w-6 h-6 ${
                        daysLeft <= 3 ? "text-danger" : daysLeft <= 7 ? "text-amber-600" : "text-primary"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm font-semibold text-foreground">{d.mahkeme}</p>
                      <p className="font-mono text-xs text-muted-foreground">{d.esasNo}</p>
                      <p className="font-body text-xs text-muted-foreground">{d.salon} · {d.hakim}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-heading text-sm font-bold text-primary">
                        {d.tarih.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">{d.saat}</p>
                      <span className={`font-body text-xs ${
                        daysLeft <= 3 ? "text-danger" : daysLeft <= 7 ? "text-amber-600" : "text-success"
                      }`}>{daysLeft} gün kaldı</span>
                    </div>
                    <button className="btn-outline text-xs flex items-center gap-1.5 flex-shrink-0">
                      <PlusCircle className="w-3.5 h-3.5" /> Takvime
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* UDF Belgesi */}
      {activeTab === "udf" && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg p-4">
            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-primary">UDF — Ulusal Dijital Format</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                UYAP&apos;a yüklenebilir XML tabanlı belge. E-imza ile imzalandıktan sonra UYAP&apos;a yüklenebilir.
              </p>
            </div>
          </div>

          <div className="card space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                  Belge Türü <span className="text-danger">*</span>
                </label>
                <select value={udfDocType} onChange={(e) => setUdfDocType(e.target.value)} className="input-field">
                  {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">Dava (Opsiyonel)</label>
                <select value={udfCaseId} onChange={(e) => setUdfCaseId(e.target.value)} className="input-field">
                  <option value="">Dava seçin</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} {c.case_number ? `— ${c.case_number}` : ""}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                Belge İçeriği <span className="text-danger">*</span>
              </label>
              <textarea
                value={udfContent}
                onChange={(e) => setUdfContent(e.target.value)}
                placeholder="Belge içeriğini buraya yazın..."
                rows={10}
                className="input-field font-body resize-none"
              />
              <p className="font-body text-xs text-muted-foreground mt-1">{udfContent.length} karakter</p>
            </div>
            <button
              onClick={handleUdfHazirla}
              disabled={udfLoading || !udfContent.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {udfLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Hazırlanıyor...</>
              ) : (
                <><Download className="w-4 h-4" /> UDF Hazırla ve İndir</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* E-İmza */}
      {activeTab === "eimza" && (
        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-primary">E-İmza / M-İmza</h2>
              <p className="font-body text-sm text-muted-foreground">UYAP üyeliği ve sertifika gerektirir</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "E-İmza", value: "Entegrasyon Bekleniyor", color: "text-amber-600 bg-amber-50" },
              { label: "UYAP Bağlantısı", value: "Chrome Eklentisi", color: "text-green-700 bg-green-50" },
              { label: "Sertifika", value: "Yüklenmedi", color: "text-muted-foreground bg-muted/50" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
                <p className="font-body text-xs opacity-70">{item.label}</p>
                <p className="font-body text-sm font-semibold mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="border border-border rounded-xl p-5">
            <h3 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" /> Aktivasyon Adımları
            </h3>
            <div className="space-y-3">
              {[
                "TÜBİTAK-BİLGEM veya e-Güven'den NES sertifikası edinin",
                "M-İmza için GSM operatörünüzden SIM tabanlı imza sertifikası alın",
                "Sertifika dosyanızı (.p12) Mizanım'a yükleyin",
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-semibold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="font-body text-sm text-foreground">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
