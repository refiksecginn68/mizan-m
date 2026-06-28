"use client";

import { useState, useMemo } from "react";
import {
  Mail,
  MailOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  X,
  Link2,
  Info,
  Search,
  Bell,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface TebligatCase {
  id: string;
  title: string;
  case_number?: string;
}

interface Tebligat {
  id: string;
  case_id?: string;
  sender: string;
  subject: string;
  received_at: string;
  deadline_at?: string;
  status: string;
  content?: string;
  is_read: boolean;
  created_at: string;
  cases?: TebligatCase | null;
}

type FilterType = "tumu" | "okunmamis" | "yaklasiyor" | "gecmis";

interface TebligatClientProps {
  initialTebligatlar: Tebligat[];
  cases: TebligatCase[];
}

function getDaysLeft(deadlineAt?: string): number | null {
  if (!deadlineAt) return null;
  const diff = new Date(deadlineAt).getTime() - Date.now();
  return Math.ceil(diff / (24 * 3600 * 1000));
}

function DeadlineBadge({ deadlineAt }: { deadlineAt?: string }) {
  const days = getDaysLeft(deadlineAt);
  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="font-body text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
        Geçti
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="font-body text-xs px-2 py-0.5 rounded-full bg-red-100 text-danger flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {days} gün kaldı
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="font-body text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        {days} gün kaldı
      </span>
    );
  }
  return (
    <span className="font-body text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      {days} gün kaldı
    </span>
  );
}

export default function TebligatClient({ initialTebligatlar, cases }: TebligatClientProps) {
  const [tebligatlar, setTebligatlar] = useState<Tebligat[]>(initialTebligatlar);
  const [filter, setFilter] = useState<FilterType>("tumu");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkCaseModal, setLinkCaseModal] = useState<string | null>(null);

  // Add form state
  const [formSender, setFormSender] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formReceivedAt, setFormReceivedAt] = useState(new Date().toISOString().slice(0, 16));
  const [formDeadlineAt, setFormDeadlineAt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCaseId, setFormCaseId] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);

  const [taraLoading, setTaraLoading] = useState(false);
  const [taraSonuc, setTaraSonuc] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = tebligatlar.length;
    const unread = tebligatlar.filter((t) => !t.is_read).length;
    const approaching = tebligatlar.filter((t) => {
      const days = getDaysLeft(t.deadline_at);
      return days !== null && days >= 0 && days <= 7;
    }).length;
    return { total, unread, approaching };
  }, [tebligatlar]);

  const filtered = useMemo(() => {
    return tebligatlar.filter((t) => {
      const days = getDaysLeft(t.deadline_at);

      if (filter === "okunmamis" && t.is_read) return false;
      if (filter === "yaklasiyor") {
        if (days === null || days < 0 || days > 7) return false;
      }
      if (filter === "gecmis") {
        if (days === null || days >= 0) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        return (
          t.sender.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tebligatlar, filter, search]);

  const handleUETSTara = async () => {
    setTaraLoading(true);
    setTaraSonuc(null);
    try {
      const res = await fetch("/api/buro/tebligat/tara", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        if (json.yeniSayi > 0) {
          setTaraSonuc(`${json.yeniSayi} yeni tebligat bulundu ve eklendi.`);
          // Tebligatları yenile
          const listRes = await fetch("/api/buro/tebligat");
          const listJson = await listRes.json();
          if (listJson.data) setTebligatlar(listJson.data);
        } else {
          setTaraSonuc("Yeni tebligat bulunamadı.");
        }
      } else {
        setTaraSonuc("Tarama başarısız: " + (json.error || "Hata"));
      }
    } catch {
      setTaraSonuc("Bağlantı hatası");
    } finally {
      setTaraLoading(false);
      setTimeout(() => setTaraSonuc(null), 5000);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch("/api/buro/tebligat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTebligatlar((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_read: true } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTebligat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSender.trim() || !formSubject.trim()) return;
    setFormLoading(true);

    try {
      const res = await fetch("/api/buro/tebligat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: formSender.trim(),
          subject: formSubject.trim(),
          received_at: new Date(formReceivedAt).toISOString(),
          deadline_at: formDeadlineAt ? new Date(formDeadlineAt).toISOString() : undefined,
          content: formContent.trim() || undefined,
          case_id: formCaseId || undefined,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setTebligatlar((prev) => [data, ...prev]);
        setShowAddModal(false);
        // Reset form
        setFormSender("");
        setFormSubject("");
        setFormReceivedAt(new Date().toISOString().slice(0, 16));
        setFormDeadlineAt("");
        setFormContent("");
        setFormCaseId("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleLinkCase = async () => {
    if (!linkCaseModal || !selectedCaseId) return;
    setLinkLoading(true);

    try {
      const res = await fetch(`/api/buro/tebligat/${linkCaseModal}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: selectedCaseId }),
      });

      if (res.ok) {
        const linkedCase = cases.find((c) => c.id === selectedCaseId);
        setTebligatlar((prev) =>
          prev.map((t) =>
            t.id === linkCaseModal
              ? { ...t, case_id: selectedCaseId, cases: linkedCase || null }
              : t
          )
        );
        setLinkCaseModal(null);
        setSelectedCaseId("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLinkLoading(false);
    }
  };

  const FILTER_TABS: { id: FilterType; label: string; count?: number }[] = [
    { id: "tumu", label: "Tümü", count: stats.total },
    { id: "okunmamis", label: "Okunmamış", count: stats.unread },
    { id: "yaklasiyor", label: "Süresi Yaklaşan", count: stats.approaching },
    { id: "gecmis", label: "Geçmiş" },
  ];

  return (
    <div className="space-y-6">
      {/* UETS Tara */}
      <div className="flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-blue-800">UETS Otomatik Tarama</p>
            <p className="font-body text-xs text-blue-700 mt-0.5">
              {taraSonuc ?? "UETS sistemini tarayarak yeni e-tebligatları getirin. Demo modunda çalışır."}
            </p>
          </div>
        </div>
        <button
          onClick={handleUETSTara}
          disabled={taraLoading}
          className="btn-primary text-sm flex items-center gap-2 flex-shrink-0"
        >
          {taraLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Taranıyor...</>
          ) : (
            <><RefreshCw className="w-4 h-4" /> UETS&apos;ten Tara</>
          )}
        </button>
      </div>

      {/* Özet bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Tebligat", value: stats.total, icon: Mail, color: "text-primary bg-primary/10" },
          { label: "Okunmamış", value: stats.unread, icon: Bell, color: "text-amber-600 bg-amber-100" },
          { label: "Süresi Yaklaşan", value: stats.approaching, icon: AlertTriangle, color: "text-danger bg-red-100" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-primary">{item.value}</p>
                <p className="font-body text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtreler ve arama */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all whitespace-nowrap ${
                filter === tab.id
                  ? "bg-white shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  filter === tab.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Gönderen veya konu ara..."
            className="input-field pl-9 text-sm"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 text-sm ml-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Manuel Tebligat Ekle
        </button>
      </div>

      {/* Tebligat listesi */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 border-2 border-dashed border-border">
          <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-base font-semibold text-primary">
            {search ? "Arama sonucu bulunamadı" : "Tebligat yok"}
          </p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {filter === "tumu" && !search
              ? "Henüz tebligat eklenmemiş. Manuel olarak ekleyebilirsiniz."
              : "Farklı filtre deneyin"}
          </p>
          {filter === "tumu" && !search && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-outline text-sm mt-4 inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Tebligat Ekle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className={`card transition-all ${!t.is_read ? "border-l-4 border-l-accent" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  t.is_read ? "bg-muted/50" : "bg-accent/15"
                }`}>
                  {t.is_read
                    ? <MailOpen className="w-5 h-5 text-muted-foreground" />
                    : <Mail className="w-5 h-5 text-accent" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className={`font-body text-sm font-semibold truncate ${!t.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {t.subject}
                    </p>
                    <DeadlineBadge deadlineAt={t.deadline_at} />
                    {!t.is_read && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-body bg-accent/20 text-accent-foreground font-medium">
                        Yeni
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <p className="font-body text-xs text-muted-foreground">
                      <span className="font-medium">Gönderen:</span> {t.sender}
                    </p>
                    <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(t.received_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {t.deadline_at && (
                      <p className="font-body text-xs text-muted-foreground">
                        <span className="font-medium">Son tarih:</span>{" "}
                        {new Date(t.deadline_at).toLocaleDateString("tr-TR")}
                      </p>
                    )}
                  </div>

                  {t.cases && (
                    <p className="font-body text-xs text-primary mt-1 flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      {t.cases.title}
                      {t.cases.case_number && ` — ${t.cases.case_number}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!t.is_read && (
                    <button
                      onClick={() => handleMarkRead(t.id)}
                      className="btn-outline text-xs flex items-center gap-1.5 py-1.5"
                      title="Okundu işaretle"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Okundu
                    </button>
                  )}
                  {!t.cases && (
                    <button
                      onClick={() => {
                        setLinkCaseModal(t.id);
                        setSelectedCaseId("");
                      }}
                      className="btn-outline text-xs flex items-center gap-1.5 py-1.5"
                      title="Dava ile ilişkilendir"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Dava Bağla
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manuel Tebligat Ekle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-heading text-lg font-bold text-primary">Manuel Tebligat Ekle</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTebligat} className="p-6 space-y-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                  Gönderen <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formSender}
                  onChange={(e) => setFormSender(e.target.value)}
                  placeholder="Mahkeme adı veya kurum"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                  Konu <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Tebligat konusu"
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                    Alınma Tarihi
                  </label>
                  <input
                    type="datetime-local"
                    value={formReceivedAt}
                    onChange={(e) => setFormReceivedAt(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                    Son Tarih
                  </label>
                  <input
                    type="date"
                    value={formDeadlineAt}
                    onChange={(e) => setFormDeadlineAt(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                  İlgili Dava (Opsiyonel)
                </label>
                <select
                  value={formCaseId}
                  onChange={(e) => setFormCaseId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Dava seçin</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.case_number ? `— ${c.case_number}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1.5">
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tebligat içeriği veya notlar..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !formSender.trim() || !formSubject.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    "Tebligat Ekle"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dava Bağla Modal */}
      {linkCaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-heading text-lg font-bold text-primary">Dava ile İlişkilendir</h2>
              <button
                onClick={() => setLinkCaseModal(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="input-field"
              >
                <option value="">Dava seçin</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.case_number ? `— ${c.case_number}` : ""}
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setLinkCaseModal(null)}
                  className="btn-outline flex-1"
                >
                  İptal
                </button>
                <button
                  onClick={handleLinkCase}
                  disabled={linkLoading || !selectedCaseId}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {linkLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "İlişkilendir"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
