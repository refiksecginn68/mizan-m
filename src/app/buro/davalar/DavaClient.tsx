"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, FolderOpen, Scale, Building2, User } from "lucide-react";

interface Client {
  id: string;
  full_name: string;
}

interface CaseRow {
  id: string;
  title: string;
  case_number: string | null;
  court: string | null;
  status: "aktif" | "kapatildi" | "arsiv";
  description: string | null;
  created_at: string;
  clients: Client | null;
}

interface DavaClientProps {
  initialCases: CaseRow[];
  clients: Client[];
}

interface FormData {
  title: string;
  client_id: string;
  case_number: string;
  court: string;
  status: string;
  description: string;
  opposing_party: string;
}

const EMPTY_FORM: FormData = {
  title: "",
  client_id: "",
  case_number: "",
  court: "",
  status: "aktif",
  description: "",
  opposing_party: "",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aktif: { label: "Aktif", color: "bg-green-100 text-green-800" },
  kapatildi: { label: "Kapatıldı", color: "bg-gray-100 text-gray-600" },
  arsiv: { label: "Arşiv", color: "bg-yellow-100 text-yellow-800" },
};

export default function DavaClient({ initialCases, clients }: DavaClientProps) {
  const router = useRouter();
  const [cases, setCases] = useState<CaseRow[]>(initialCases);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tumu");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const filtered = cases.filter((c) => {
    const matchStatus = statusFilter === "tumu" || c.status === statusFilter;
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.case_number && c.case_number.includes(search)) ||
      (c.court && c.court.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formData.title.trim()) {
      setFormError("Dava başlığı zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/buro/davalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Bir hata oluştu");
        return;
      }
      setCases((prev) => [data.case, ...prev]);
      setShowModal(false);
      setFormData(EMPTY_FORM);
    } catch {
      setFormError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Başlık, dava no veya mahkeme ara..."
            className="input-field pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setShowModal(true); setFormData(EMPTY_FORM); setFormError(""); }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Yeni Dava
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { value: "tumu", label: "Tümü" },
          { value: "aktif", label: "Aktif" },
          { value: "kapatildi", label: "Kapatıldı" },
          { value: "arsiv", label: "Arşiv" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full font-body text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-white"
                : "bg-white text-muted-foreground border border-border hover:border-primary hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cases list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-lg font-bold text-primary">
            {search || statusFilter !== "tumu" ? "Sonuç bulunamadı" : "Henüz dava eklenmedi"}
          </p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {search || statusFilter !== "tumu"
              ? "Filtrelerinizi değiştirmeyi deneyin."
              : "\"Yeni Dava\" butonuna tıklayarak ilk dava dosyasını oluşturun."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((caseRow) => {
            const statusInfo = STATUS_LABELS[caseRow.status] || STATUS_LABELS.aktif;
            return (
              <button
                key={caseRow.id}
                onClick={() => router.push(`/buro/dava/${caseRow.id}`)}
                className="card w-full text-left flex items-start gap-4 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="font-heading text-base font-bold text-primary leading-snug">{caseRow.title}</p>
                    <span className={`px-2.5 py-0.5 rounded-full font-body text-xs font-medium flex-shrink-0 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {caseRow.clients && (
                      <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {caseRow.clients.full_name}
                      </span>
                    )}
                    {caseRow.court && (
                      <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {caseRow.court}
                      </span>
                    )}
                    {caseRow.case_number && (
                      <span className="font-mono text-xs text-muted-foreground">
                        #{caseRow.case_number}
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-body text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                  {new Date(caseRow.created_at).toLocaleDateString("tr-TR")}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-background rounded-2xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-primary">Yeni Dava Ekle</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="font-body text-sm text-red-700">{formError}</p>
                </div>
              )}

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Dava Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Örn: Boşanma Davası - Ahmet Yılmaz"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Müvekkil
                </label>
                <select
                  className="input-field w-full"
                  value={formData.client_id}
                  onChange={(e) => setFormData((p) => ({ ...p, client_id: e.target.value }))}
                >
                  <option value="">— Müvekkil Seçin —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                    Dava No
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="2024/1234"
                    value={formData.case_number}
                    onChange={(e) => setFormData((p) => ({ ...p, case_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                    Durum
                  </label>
                  <select
                    className="input-field w-full"
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="kapatildi">Kapatıldı</option>
                    <option value="arsiv">Arşiv</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Mahkeme
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="İstanbul 1. Aile Mahkemesi"
                  value={formData.court}
                  onChange={(e) => setFormData((p) => ({ ...p, court: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Karşı Taraf
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Karşı tarafın adı"
                  value={formData.opposing_party}
                  onChange={(e) => setFormData((p) => ({ ...p, opposing_party: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Açıklama
                </label>
                <textarea
                  className="input-field w-full resize-none"
                  placeholder="Dava hakkında kısa açıklama..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1" disabled={saving}>
                  İptal
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Kaydediliyor...
                    </span>
                  ) : "Dava Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
