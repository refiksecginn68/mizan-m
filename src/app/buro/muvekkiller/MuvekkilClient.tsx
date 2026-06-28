"use client";

import { useState, useCallback } from "react";
import { Search, Plus, X, User, Phone, Mail, MapPin, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  tc_no: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface MuvekkilClientProps {
  initialClients: Client[];
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  tc_no: string;
  address: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  full_name: "",
  email: "",
  phone: "",
  tc_no: "",
  address: "",
  notes: "",
};

export default function MuvekkilClient({ initialClients }: MuvekkilClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (value: string) => {
    setSearch(value);
    setSearching(true);
    try {
      const res = await fetch(`/api/buro/muvekkiller?search=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch {
      // sessiz hata
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formData.full_name.trim()) {
      setFormError("Ad soyad zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/buro/muvekkiller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Bir hata oluştu");
        return;
      }
      setClients((prev) => [data.client, ...prev]);
      setShowModal(false);
      setFormData(EMPTY_FORM);
    } catch {
      setFormError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="İsim, e-posta veya TC no ile ara..."
            className="input-field pl-9 w-full"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <button
          onClick={() => { setShowModal(true); setFormData(EMPTY_FORM); setFormError(""); }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Yeni Müvekkil
        </button>
      </div>

      {/* List */}
      {clients.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-lg font-bold text-primary">
            {search ? "Arama sonucu bulunamadı" : "Henüz müvekkil eklenmedi"}
          </p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {search
              ? "Farklı bir arama terimi deneyin."
              : "\"Yeni Müvekkil\" butonuna tıklayarak ilk müvekkilinizi ekleyin."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="card p-0 overflow-hidden">
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/5 transition-colors"
                onClick={() => toggleExpand(client.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading text-base font-bold text-primary">{client.full_name}</p>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {client.phone && (
                        <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </span>
                      )}
                      {client.email && (
                        <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="font-body text-xs text-muted-foreground hidden sm:block">
                    {new Date(client.created_at).toLocaleDateString("tr-TR")}
                  </span>
                  {expandedId === client.id
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
              </button>

              {/* Expanded detail */}
              {expandedId === client.id && (
                <div className="border-t border-border px-4 pb-4 pt-3 bg-primary/5 animate-fade-in">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {client.tc_no && (
                      <div>
                        <p className="font-body text-xs text-muted-foreground mb-0.5">TC Kimlik No</p>
                        <p className="font-body text-sm text-foreground">{client.tc_no}</p>
                      </div>
                    )}
                    {client.address && (
                      <div className="sm:col-span-2">
                        <p className="font-body text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Adres
                        </p>
                        <p className="font-body text-sm text-foreground">{client.address}</p>
                      </div>
                    )}
                    {client.notes && (
                      <div className="sm:col-span-2">
                        <p className="font-body text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Notlar
                        </p>
                        <p className="font-body text-sm text-foreground whitespace-pre-line">{client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-background rounded-2xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-primary">Yeni Müvekkil Ekle</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
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
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Ahmet Yılmaz"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                    E-posta
                  </label>
                  <input
                    type="email"
                    className="input-field w-full"
                    placeholder="ahmet@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    className="input-field w-full"
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  TC Kimlik No <span className="font-body text-xs text-muted-foreground">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="11 haneli TC kimlik numarası"
                  maxLength={11}
                  value={formData.tc_no}
                  onChange={(e) => setFormData((p) => ({ ...p, tc_no: e.target.value.replace(/\D/g, "") }))}
                />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Adres <span className="font-body text-xs text-muted-foreground">(opsiyonel)</span>
                </label>
                <textarea
                  className="input-field w-full resize-none"
                  placeholder="Açık adres..."
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Notlar <span className="font-body text-xs text-muted-foreground">(opsiyonel)</span>
                </label>
                <textarea
                  className="input-field w-full resize-none"
                  placeholder="Müvekkil hakkında notlar..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline flex-1"
                  disabled={saving}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Kaydediliyor...
                    </span>
                  ) : "Müvekkil Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
