"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, X, Calendar, MapPin, Clock, Tag, Scale, Users,
  AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Trash2,
} from "lucide-react";

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
  urgency?: "dusuk" | "orta" | "yuksek" | "acil";
  reminder_offsets_minutes?: number[];
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
  urgency: string;
  reminder_offsets_minutes: number[];
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
  urgency: "orta",
  reminder_offsets_minutes: [],
};

const URGENCY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  dusuk: { label: "Düşük", color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  orta: { label: "Orta", color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
  yuksek: { label: "Yüksek", color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  acil: { label: "Acil", color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
};

const REMINDER_OPTIONS: Array<{ minutes: number; label: string }> = [
  { minutes: 60, label: "1 saat kala" },
  { minutes: 1440, label: "1 gün kala" },
  { minutes: 4320, label: "3 gün kala" },
];

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  durusma: { label: "Duruşma", color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-400", icon: Scale },
  toplanti: { label: "Toplantı", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-400", icon: Users },
  sure: { label: "Süre", color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-400", icon: AlertCircle },
  diger: { label: "Diğer", color: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400", icon: Calendar },
};

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function formatCountdown(dateStr: string): string | null {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0 || diff > 24 * 3600 * 1000) return null;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}s ${mins}dk sonra`;
  if (mins > 0) return `${mins} dk sonra`;
  return "Şimdi";
}

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Mini takvim state
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  // Scroll to date refs
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      const data = await res.json() as { error?: string; synced?: number; imported?: number };
      if (!res.ok) { setSyncMessage(data.error ?? "Senkronizasyon hatası."); return; }
      setSyncMessage(`Tamamlandı: ${data.synced} kontrol, ${data.imported} yeni.`);
      window.location.reload();
    } catch {
      setSyncMessage("Bağlantı hatası.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu etkinliği silmek istediğinizden emin misiniz?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/buro/takvim?id=${id}`, { method: "DELETE" });
      if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  const now = new Date().toISOString();
  const filtered = events.filter((ev) => {
    if (filter === "gelecek") return ev.starts_at >= now;
    if (filter === "gecmis") return ev.starts_at < now;
    return true;
  });

  // Group by date key
  const grouped: Record<string, CalendarEvent[]> = {};
  filtered.forEach((ev) => {
    const key = new Date(ev.starts_at).toISOString().slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  // Mini calendar generation
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const adjustedFirst = (firstDow + 6) % 7; // Mon=0

  // Events on each day of the displayed month
  const eventDays = new Set(
    events.map((e) => {
      const d = new Date(e.starts_at);
      if (d.getMonth() === calMonth && d.getFullYear() === calYear)
        return d.getDate();
      return null;
    }).filter(Boolean)
  );

  function scrollToDate(year: number, month: number, day: number) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const el = dateRefs.current[key];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else setFilter("tumu");
  }

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
      const data = await res.json() as { event?: CalendarEvent; error?: string };
      if (!res.ok || !data.event) { setFormError(data.error || "Bir hata oluştu"); return; }
      setEvents((prev) => [data.event!, ...prev].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setShowModal(false);
      setFormData(EMPTY_FORM);
    } catch {
      setFormError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Sol: Mini takvim */}
      <div className="w-64 flex-shrink-0 space-y-4">
        {/* Mini Calendar */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                const d = new Date(calYear, calMonth - 1);
                setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
              }}
              className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <p className="font-heading text-xs font-bold text-primary capitalize">
              {new Date(calYear, calMonth).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
            </p>
            <button
              onClick={() => {
                const d = new Date(calYear, calMonth + 1);
                setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
              }}
              className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-0.5">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: adjustedFirst }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = isSameDay(new Date(calYear, calMonth, day), today);
              const hasEvent = eventDays.has(day);
              return (
                <button
                  key={day}
                  onClick={() => scrollToDate(calYear, calMonth, day)}
                  className={`relative text-center text-xs py-1 rounded-lg transition-colors font-body
                    ${isToday ? "bg-primary text-white font-bold" : "hover:bg-primary/10 text-foreground"}`}
                >
                  {day}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Etkinlik tipi efsane */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
          <p className="font-heading text-xs font-bold text-primary mb-2">Etkinlik Türleri</p>
          {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
            const count = events.filter((e) => e.event_type === key).length;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="font-body text-xs text-foreground flex-1">{cfg.label}</span>
                <span className="font-body text-xs text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Google Takvim */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <p className="font-body text-xs font-medium text-foreground">
              Google Takvim {isGoogleConnected ? <span className="text-green-600">● bağlı</span> : <span className="text-gray-400">○ bağlı değil</span>}
            </p>
          </div>
          {syncMessage && <p className="font-body text-[10px] text-muted-foreground mb-2">{syncMessage}</p>}
          {!isGoogleConnected ? (
            <a href="/api/google-calendar/auth"
              className="block text-center text-xs font-semibold text-blue-600 hover:underline">
              Bağlan →
            </a>
          ) : (
            <button onClick={handleSync} disabled={syncing}
              className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Senkronize..." : "Senkronize Et"}
            </button>
          )}
        </div>
      </div>

      {/* Sağ: Etkinlikler */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
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
            <Plus className="w-4 h-4" /> Yeni Etkinlik
          </button>
        </div>

        {/* Events */}
        {Object.keys(grouped).length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-heading text-lg font-bold text-primary">Etkinlik bulunamadı</p>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {filter === "gelecek" ? "Yaklaşan etkinlik yok. Yeni etkinlik ekleyin." : "Bu görünümde etkinlik yok."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateKey, dayEvents]) => {
              const dayDate = new Date(dateKey);
              const isToday = isSameDay(dayDate, today);
              const dateLabel = dayDate.toLocaleDateString("tr-TR", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              });
              return (
                <div key={dateKey} ref={(el) => { dateRefs.current[dateKey] = el; }}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className={`font-heading text-sm font-bold capitalize ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                      {dateLabel}
                      {isToday && (
                        <span className="ml-2 bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full font-body">Bugün</span>
                      )}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-2">
                    {dayEvents.map((ev) => {
                      const typeConfig = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.diger;
                      const TypeIcon = typeConfig.icon;
                      const past = ev.starts_at < now;
                      const countdown = formatCountdown(ev.starts_at);

                      return (
                        <div key={ev.id}
                          className={`card flex items-start gap-4 group transition-opacity ${past ? "opacity-60" : ""}`}
                        >
                          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-body font-semibold text-foreground">{ev.title}</p>
                                {countdown && (
                                  <span className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    {countdown}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {ev.urgency && ev.urgency !== "orta" && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-body border flex items-center gap-1 ${URGENCY_CONFIG[ev.urgency]?.color ?? ""}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${URGENCY_CONFIG[ev.urgency]?.dot ?? ""}`} />
                                    {URGENCY_CONFIG[ev.urgency]?.label}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-body border ${typeConfig.color}`}>
                                  {typeConfig.label}
                                </span>
                                <button
                                  onClick={() => handleDelete(ev.id)}
                                  disabled={deletingId === ev.id}
                                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-all"
                                >
                                  {deletingId === ev.id
                                    ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                    : <Trash2 className="w-3 h-3" />}
                                </button>
                              </div>
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
                                  <MapPin className="w-3 h-3" /> {ev.location}
                                </span>
                              )}
                              {ev.cases && (
                                <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                                  <Tag className="w-3 h-3" /> {ev.cases.title}
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
              );
            })}
          </div>
        )}
      </div>

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
                <input type="text" className="input-field w-full" placeholder="Etkinlik başlığı"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} required />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Etkinlik Türü</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key} type="button"
                        onClick={() => setFormData((p) => ({ ...p, event_type: key }))}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all text-xs font-body ${
                          formData.event_type === key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Icon className="w-4 h-4" /> {cfg.label}
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
                  <input type="datetime-local" className="input-field w-full"
                    value={formData.starts_at}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setFormData((p) => {
                        // Bitiş otomatik +1 saat (kullanıcı henüz düzenlemediyse)
                        let newEnd = p.ends_at;
                        if (newStart) {
                          const d = new Date(newStart);
                          d.setHours(d.getHours() + 1);
                          const pad = (n: number) => String(n).padStart(2, "0");
                          newEnd = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        }
                        return { ...p, starts_at: newStart, ends_at: newEnd };
                      });
                    }} required />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Bitiş</label>
                  <input type="datetime-local" className="input-field w-full"
                    value={formData.ends_at}
                    onChange={(e) => setFormData((p) => ({ ...p, ends_at: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Aciliyet</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
                    <button key={key} type="button"
                      onClick={() => setFormData((p) => ({ ...p, urgency: key }))}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all text-xs font-body ${
                        formData.urgency === key
                          ? cfg.color + " font-semibold"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} /> {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Hatırlatıcı</label>
                <div className="flex gap-2">
                  {REMINDER_OPTIONS.map((opt) => {
                    const active = formData.reminder_offsets_minutes.includes(opt.minutes);
                    return (
                      <button key={opt.minutes} type="button"
                        onClick={() => setFormData((p) => ({
                          ...p,
                          reminder_offsets_minutes: active
                            ? p.reminder_offsets_minutes.filter((m) => m !== opt.minutes)
                            : [...p.reminder_offsets_minutes, opt.minutes],
                        }))}
                        className={`flex-1 p-2 rounded-lg border text-xs font-body transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="font-body text-[10px] text-muted-foreground mt-1">
                  Seçilen zamanlarda uygulama içi bildirim alırsınız.
                </p>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">İlgili Dava</label>
                <select className="input-field w-full" value={formData.case_id}
                  onChange={(e) => setFormData((p) => ({ ...p, case_id: e.target.value }))}>
                  <option value="">— Dava Seçin —</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}{c.case_number ? ` (${c.case_number})` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Müvekkil</label>
                <select className="input-field w-full" value={formData.client_id}
                  onChange={(e) => setFormData((p) => ({ ...p, client_id: e.target.value }))}>
                  <option value="">— Müvekkil Seçin —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Konum</label>
                <input type="text" className="input-field w-full"
                  placeholder="İstanbul Adalet Sarayı, B Blok..."
                  value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Açıklama</label>
                <textarea className="input-field w-full resize-none" rows={2}
                  placeholder="Etkinlik detayları..."
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} />
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
