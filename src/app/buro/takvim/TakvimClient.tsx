"use client";

import { useState, useEffect } from "react";
import { Plus, X, Calendar, MapPin, Clock, Tag, Scale, Users, AlertCircle, RefreshCw } from "lucide-react";

interface CaseOption {
  id: string;
  title: string;
  case_number: string | null;
}

interface ClientOption {
  id: string;
  full_name: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_type: "durusma" | "toplanti" | "sure" | "diger";
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  is_reminder_sent: boolean;
  cases: { id: string; title: string; case_number: string | null } | null;
  clients: { id: string; full_name: string } | null;
}

interface TakvimClientProps {
  initialEvents: CalendarEvent[];
  cases: CaseOption[];
  clients: ClientOption[];
  googleConnected: boolean;
}

interface FormData {
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  case_id: string;
  client_id: string;
  location: string;
  description: string;
}

const EMPTY_FORM: FormData = {
  title: "",
  event_type: "durusma",
  starts_at: "",
  ends_at: "",
  case_id: "",
  client_id: "",
  location: "",
  description: "",
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  durusma: { label: "Duruşma", color: "bg-red-100 text-red-800 border-red-200", icon: Scale },
  toplanti: { label: "Toplantı", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Users },
  sure: { label: "Süre", color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertCircle },
  diger: { label: "Diğer", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Calendar },
};

function groupEventsByDate(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  events.forEach((ev) => {
    const date = new Date(ev.starts_at).toLocaleDateString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(ev);
  });
  return groups;
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TakvimClient({ initialEvents, cases, clients, googleConnected }: TakvimClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [filter, setFilter] = useState<"tumu" | "gelecek" | "gecmis">("gelecek");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [isGoogleConnected, setIsGoogleConnected] = useState(googleConnected);

  // URL parametresinden Google bağlantı sonucunu oku
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const google = params.get("google");
    if (google === "connected") {
      setIsGoogleConnected(true);
      setSyncMessage("Google Takvim başarıyla bağlandı!");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (google === "error") {
      setSyncMessage("Google Takvim bağlanırken hata oluştu.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/google-calendar/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setSyncMessage(data.error ?? "Senkronizasyon hatası."); return; }
      setSyncMessage(`Senkronizasyon tamam: ${data.synced} etkinlik kontrol edildi, ${data.imported} yeni eklendi.`);
      // Sayfayı yenileyerek yeni etkinlikleri göster
      window.location.reload();
    } catch {
      setSyncMessage("Bağlantı hatası.");
    } finally {
      setSyncing(false);
    }
  };

  const now = new Date().toISOString();

  const filtered = events.filter((ev) => {
    if (filter === "gelecek") return ev.starts_at >= now;
    if (filter === "gecmis") return ev.starts_at < now;
    return true;
  });

  const grouped = groupEventsByDate(filtered);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formData.title.trim()) { setFormError("Başlık zorunludur."); return; }
    if (!formData.starts_at) { setFormError("Tarih ve saat zorunludur."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/buro/takvim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Bir hata oluştu"); return; }
      setEvents((prev) => [data.event, ...prev].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setShowModal(false);
      setFormData(EMPTY_FORM);
    } catch {
      setFormError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Google Takvim banner */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border border-border bg-white">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm font-medium text-foreground">
              Google Takvim{isGoogleConnected ? " bağlı" : " bağlı değil"}
            </p>
            {syncMessage && (
              <p className="font-body text-xs text-muted-foreground truncate">{syncMessage}</p>
            )}
          </div>
          {isGoogleConnected && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500" />
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isGoogleConnected ? (
            <a
              href="/api/google-calendar/auth"
              className="btn-outline text-sm flex items-center gap-1.5 px-3 py-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google ile Bağlan
            </a>
          ) : (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-outline text-sm flex items-center gap-1.5 px-3 py-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Senkronize ediliyor..." : "Senkronize Et"}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          {(["gelecek", "tumu", "gecmis"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full font-body text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-white text-muted-foreground border border-border hover:border-primary hover:text-primary"
              }`}
            >
              {f === "gelecek" ? "Yaklaşan" : f === "gecmis" ? "Geçmiş" : "Tümü"}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowModal(true); setFormData(EMPTY_FORM); setFormError(""); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Etkinlik
        </button>
      </div>

      {/* Events grouped by date */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-lg font-bold text-primary">Etkinlik bulunamadı</p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {filter === "gelecek"
              ? "Yaklaşan etkinlik yok. Yeni etkinlik ekleyin."
              : "Bu görünümde etkinlik yok."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className={`font-heading text-sm font-bold capitalize ${
                  dayEvents.some((e) => isToday(e.starts_at)) ? "text-accent" : "text-muted-foreground"
                }`}>
                  {date}
                  {dayEvents.some((e) => isToday(e.starts_at)) && (
                    <span className="ml-2 bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full font-body">
                      Bugün
                    </span>
                  )}
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-2">
                {dayEvents.map((ev) => {
                  const typeConfig = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.diger;
                  const TypeIcon = typeConfig.icon;
                  const past = isPast(ev.starts_at);

                  return (
                    <div
                      key={ev.id}
                      className={`card flex items-start gap-4 transition-opacity ${past ? "opacity-60" : ""}`}
                    >
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="font-body font-semibold text-foreground">{ev.title}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-body border flex-shrink-0 ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ev.starts_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            {ev.ends_at && (
                              <> — {new Date(ev.ends_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</>
                            )}
                          </span>
                          {ev.location && (
                            <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.location}
                            </span>
                          )}
                          {ev.cases && (
                            <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {ev.cases.title}
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="font-body text-xs text-muted-foreground mt-1.5 line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-background rounded-2xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-primary">Yeni Etkinlik</h2>
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
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Etkinlik başlığı"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Etkinlik Türü
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, event_type: key }))}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all text-xs font-body ${
                          formData.event_type === key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                    Başlangıç <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field w-full"
                    value={formData.starts_at}
                    onChange={(e) => setFormData((p) => ({ ...p, starts_at: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                    Bitiş
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field w-full"
                    value={formData.ends_at}
                    onChange={(e) => setFormData((p) => ({ ...p, ends_at: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  İlgili Dava
                </label>
                <select
                  className="input-field w-full"
                  value={formData.case_id}
                  onChange={(e) => setFormData((p) => ({ ...p, case_id: e.target.value }))}
                >
                  <option value="">— Dava Seçin —</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}{c.case_number ? ` (${c.case_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Konum
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="İstanbul Adalet Sarayı, B Blok..."
                  value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Açıklama
                </label>
                <textarea
                  className="input-field w-full resize-none"
                  placeholder="Etkinlik detayları..."
                  rows={2}
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
                  ) : "Etkinlik Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
