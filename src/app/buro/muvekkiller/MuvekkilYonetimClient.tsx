"use client";

import { useState } from "react";
import {
  Search, Plus, X, User, Phone, Mail,
  FileUp, Copy, Check, Loader2, AlertCircle,
  Send, ExternalLink, ChevronDown, ChevronUp,
  LayoutList, LayoutGrid, Table2, Building2,
  FileText, Download, RefreshCw, Scale,
  Calendar, BadgeCheck,
} from "lucide-react";

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  tc_no: string | null;
  address: string | null;
  notes: string | null;
  vekalet_no: string | null;
  dosya_no: string | null;
  vekalet_tarihi: string | null;
  noter: string | null;
  uyap_synced: boolean;
  created_at: string;
}

interface DavaItem {
  id: string;
  title: string;
  case_number: string | null;
  court?: string | null;
  status?: string | null;
}

interface BelgeItem {
  id: string;
  ad: string;
  tur: string;
  tarih: string;
  boyut: string;
}

interface ClientWithData extends Client {
  davalar: DavaItem[];
  belgeler: Record<string, BelgeItem[]>;
}

interface SimpleCase {
  id: string;
  title: string;
  case_number?: string;
}

interface Props {
  initialClients: Client[];
  casesByClient: Record<string, DavaItem[]>;
  allCases: SimpleCase[];
  // Müvekkil bazlı ödeme özeti (Finans modülü metadata.client_id üzerinden)
  paymentSummary?: Record<string, { paid: number; pending: number }>;
}

const EMPTY_FORM = {
  full_name: "", email: "", phone: "", tc_no: "", address: "", notes: "",
  vekalet_no: "", dosya_no: "", vekalet_tarihi: "", noter: "",
};

type ViewMode = "liste" | "kart" | "tablo";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getColor(name: string) {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
    "bg-red-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

interface TalepResult {
  uploadLink: string;
  smsSent: boolean;
  smsError: string;
}

export default function MuvekkilYonetimClient({ initialClients, casesByClient, allCases, paymentSummary = {} }: Props) {
  const [clients, setClients] = useState<ClientWithData[]>(() =>
    initialClients.map((c) => ({
      ...c,
      davalar: casesByClient[c.id] ?? [],
      belgeler: {},
    }))
  );
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("liste");

  // Yeni müvekkil modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [syncResult, setSyncResult] = useState<{ davaSayisi: number; alreadyExists: boolean } | null>(null);

  // Belge talep modal
  const [talepClientId, setTalepClientId] = useState<string | null>(null);
  const [talepCaseId, setTalepCaseId] = useState("");
  const [talepMessage, setTalepMessage] = useState("Davanıza ait belgeleri yüklemenizi rica ederiz.");
  const [talepLoading, setTalepLoading] = useState(false);
  const [talepResult, setTalepResult] = useState<TalepResult | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const talepClient = talepClientId ? clients.find((c) => c.id === talepClientId) ?? null : null;

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.tc_no ?? "").includes(q) ||
      (c.dosya_no ?? "").toLowerCase().includes(q)
    );
  });

  function resetModal() {
    setShowAddModal(false);
    setFormData(EMPTY_FORM);
    setFormError("");
    setSyncResult(null);
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formData.full_name.trim()) { setFormError("Ad Soyad zorunludur."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/buro/muvekkil/vekalet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          tc_no: formData.tc_no || undefined,
          address: formData.address || undefined,
          notes: formData.notes || undefined,
          vekalet_no: formData.vekalet_no || undefined,
          dosya_no: formData.dosya_no || undefined,
          vekalet_tarihi: formData.vekalet_tarihi || undefined,
          noter: formData.noter || undefined,
        }),
      });
      const data = await res.json() as {
        client?: Client;
        clientId?: string;
        alreadyExists?: boolean;
        davalar?: DavaItem[];
        belgeler?: Record<string, BelgeItem[]>;
        error?: string;
      };
      if (!res.ok || data.error) { setFormError(data.error ?? "Hata"); return; }

      const newClient: ClientWithData = {
        ...(data.client ?? { ...formData, id: data.clientId ?? "", uyap_synced: (data.davalar?.length ?? 0) > 0, created_at: new Date().toISOString() } as unknown as Client),
        davalar: data.davalar ?? [],
        belgeler: data.belgeler ?? {},
      };

      if (data.alreadyExists) {
        setClients((prev) => prev.map((c) => c.id === newClient.id ? { ...c, davalar: newClient.davalar, belgeler: newClient.belgeler } : c));
      } else {
        setClients((prev) => [newClient, ...prev]);
      }

      setSyncResult({ davaSayisi: data.davalar?.length ?? 0, alreadyExists: data.alreadyExists ?? false });
    } catch { setFormError("Bağlantı hatası."); }
    finally { setSaving(false); }
  }

  async function sendBelgeTalep() {
    if (!talepClient) return;
    setTalepLoading(true);
    setTalepResult(null);
    try {
      const res = await fetch("/api/buro/belge-talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: talepClient.id,
          case_id: talepCaseId || undefined,
          message: talepMessage,
        }),
      });
      const data = await res.json() as TalepResult & { error?: string };
      if (!res.ok || data.error) { setFormError(data.error ?? "Hata"); return; }
      setTalepResult(data);
    } catch { setFormError("Bağlantı hatası"); }
    finally { setTalepLoading(false); }
  }

  function openTalepModal(clientId: string) {
    setTalepClientId(clientId);
    setTalepCaseId("");
    setTalepMessage("Davanıza ait belgeleri yüklemenizi rica ederiz.");
    setTalepResult(null);
  }

  function closeTalepModal() {
    setTalepClientId(null);
    setTalepResult(null);
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // ── Görünüm: Liste ──────────────────────────────────────────────────────────
  function renderListe() {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filtered.map((c, idx) => {
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} className={idx > 0 ? "border-t border-gray-50" : ""}>
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full ${getColor(c.full_name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {getInitials(c.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0f1729]">{c.full_name}</p>
                    {c.uyap_synced && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3" /> UYAP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {c.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone className="w-3 h-3" />{c.phone}</span>}
                    {c.email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail className="w-3 h-3" />{c.email}</span>}
                    {c.davalar.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#c9a84c] font-medium">
                        <Scale className="w-3 h-3" />{c.davalar.length} dava
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openTalepModal(c.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                  >
                    <FileUp className="w-3.5 h-3.5" /> Belge İste
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded-lg"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && <ClientDetail client={c} />}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Görünüm: Kart ───────────────────────────────────────────────────────────
  function renderKart() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#c9a84c]/30 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full ${getColor(c.full_name)} flex items-center justify-center text-white text-base font-bold flex-shrink-0`}>
                {getInitials(c.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0f1729] leading-tight">{c.full_name}</p>
                {c.uyap_synced && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-1">
                    <BadgeCheck className="w-3 h-3" /> UYAP Senkronize
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              {c.phone && <p className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{c.phone}</p>}
              {c.email && <p className="flex items-center gap-1.5 text-xs text-gray-500 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{c.email}</p>}
              {c.dosya_no && <p className="flex items-center gap-1.5 text-xs text-gray-500"><Scale className="w-3.5 h-3.5 flex-shrink-0" />Dosya: {c.dosya_no}</p>}
            </div>

            {c.davalar.length > 0 && (
              <div className="bg-[#f4f5f7] rounded-xl px-3 py-2 mb-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">{c.davalar.length} Aktif Dava</p>
                {c.davalar.slice(0, 2).map((d) => (
                  <div key={d.id} className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] flex-shrink-0" />
                    <p className="text-xs text-[#0f1729] truncate">{d.title}{d.case_number ? ` · ${d.case_number}` : ""}</p>
                  </div>
                ))}
                {c.davalar.length > 2 && <p className="text-[10px] text-gray-400">+{c.davalar.length - 2} daha</p>}
              </div>
            )}

            {/* Ödeme özeti + Finans'a hızlı geçiş */}
            {paymentSummary[c.id] && (
              <div className="bg-green-50 rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-green-700">
                  Tahsil: {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(paymentSummary[c.id].paid)}
                </p>
                {paymentSummary[c.id].pending > 0 && (
                  <p className="text-[10px] font-semibold text-yellow-700">
                    Bekleyen: {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(paymentSummary[c.id].pending)}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => openTalepModal(c.id)}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
              >
                <FileUp className="w-3.5 h-3.5" /> Belge İste
              </button>
              <a
                href={`/buro/finans?client=${c.id}&clientName=${encodeURIComponent(c.full_name)}`}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
              >
                ₺ Finans
              </a>
              <button
                onClick={() => { setExpandedId(expandedId === c.id ? null : c.id); setViewMode("liste"); }}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg bg-[#0f1729]/5 text-[#0f1729] hover:bg-[#0f1729]/10 transition-colors"
              >
                Detay
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Görünüm: Tablo ──────────────────────────────────────────────────────────
  function renderTablo() {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase">Müvekkil</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase hidden sm:table-cell">TC</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase hidden md:table-cell">Telefon</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase hidden lg:table-cell">Dosya No</th>
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Dava</th>
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">UYAP</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase hidden md:table-cell">Kayıt</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => (
              <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx > 0 ? "border-t border-gray-50" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${getColor(c.full_name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {getInitials(c.full_name)}
                    </div>
                    <p className="font-semibold text-[#0f1729] text-sm">{c.full_name}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <span className="font-mono text-xs text-gray-500">{c.tc_no ?? "—"}</span>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-600">{c.phone ?? "—"}</td>
                <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-600">{c.dosya_no ?? "—"}</td>
                <td className="px-4 py-3.5 text-center">
                  {c.davalar.length > 0 ? (
                    <span className="inline-block text-xs font-semibold text-[#c9a84c] bg-[#c9a84c]/10 px-2 py-0.5 rounded-full">
                      {c.davalar.length}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {c.uyap_synced
                    ? <BadgeCheck className="w-4 h-4 text-emerald-500 mx-auto" />
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-400">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => openTalepModal(c.id)}
                    className="text-xs text-[#c9a84c] hover:underline"
                  >
                    Belge İste
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0f1729]">Müvekkiller</h1>
            <p className="text-sm text-gray-400 mt-0.5">{clients.length} müvekkil kayıtlı</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#c9a84c] text-white hover:bg-[#e7b743] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni Müvekkil
          </button>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {/* Arama */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, telefon, TC veya dosya no ara..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#c9a84c] bg-[#f9f9f9]"
            />
          </div>
          {/* Görünüm toggle */}
          <div className="flex items-center gap-1 bg-[#f4f5f7] rounded-xl p-1 flex-shrink-0">
            {([["liste", LayoutList], ["kart", LayoutGrid], ["tablo", Table2]] as [ViewMode, React.ElementType][]).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-lg transition-colors ${viewMode === mode ? "bg-white shadow-sm text-[#c9a84c]" : "text-gray-400 hover:text-gray-600"}`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 p-4 sm:p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <User className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-heading text-base font-bold text-[#0f1729] mb-1">
              {search ? "Müvekkil bulunamadı" : "Henüz müvekkil eklenmemiş"}
            </p>
            {!search && (
              <button onClick={() => setShowAddModal(true)}
                className="mt-4 flex items-center gap-2 bg-[#c9a84c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#e7b743] transition-colors">
                <Plus className="w-4 h-4" /> İlk Müvekkili Ekle
              </button>
            )}
          </div>
        ) : (
          viewMode === "liste" ? renderListe() :
          viewMode === "kart" ? renderKart() :
          renderTablo()
        )}
      </div>

      {/* ── Yeni Müvekkil Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={resetModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-heading text-lg font-bold text-[#0f1729]">Yeni Müvekkil Ekle</h2>
                <p className="text-xs text-gray-400">Vekalet bilgileriyle UYAP otomatik senkronize edilir</p>
              </div>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-red-600">{formError}</p>
                </div>
              )}

              {syncResult ? (
                /* Başarı ekranı */
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-[#0f1729] mb-2">
                    {syncResult.alreadyExists ? "Müvekkil Güncellendi" : "Müvekkil Eklendi"}
                  </h3>
                  {syncResult.davaSayisi > 0 ? (
                    <div className="flex items-center justify-center gap-2 bg-emerald-50 rounded-xl px-4 py-3 mb-4">
                      <BadgeCheck className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-semibold">
                        {syncResult.davaSayisi} dava UYAP&apos;tan senkronize edildi
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">Dosya numarası girilmediği için UYAP senkronizasyonu atlandı.</p>
                  )}
                  <button onClick={resetModal} className="w-full py-2.5 rounded-xl bg-[#0f1729] text-white text-sm font-semibold hover:bg-[#1a2744] transition-colors">
                    Tamam
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddClient} className="space-y-4">
                  {/* Kişisel bilgiler */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Kişisel Bilgiler</p>
                    <div className="space-y-3">
                      <input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Ad Soyad *" className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Telefon" className="text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
                        <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="E-posta" className="text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
                      </div>
                      <input value={formData.tc_no} onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
                        placeholder="TC Kimlik No" maxLength={11}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] font-mono" />
                      <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Adres" rows={2}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
                    </div>
                  </div>

                  {/* Vekalet bilgileri */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Vekalet & UYAP Bilgileri
                    </p>
                    <div className="bg-[#f9f9fb] border border-dashed border-gray-200 rounded-xl p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={formData.vekalet_no} onChange={(e) => setFormData({ ...formData, vekalet_no: e.target.value })}
                          placeholder="Vekalet No" className="text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] bg-white" />
                        <input value={formData.dosya_no} onChange={(e) => setFormData({ ...formData, dosya_no: e.target.value })}
                          placeholder="Esas / Dosya No" className="text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Vekalet Tarihi</label>
                          <input type="date" value={formData.vekalet_tarihi} onChange={(e) => setFormData({ ...formData, vekalet_tarihi: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] bg-white" />
                        </div>
                        <input value={formData.noter} onChange={(e) => setFormData({ ...formData, noter: e.target.value })}
                          placeholder="Noter Adı" className="text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] bg-white self-end" />
                      </div>
                      {formData.dosya_no && (
                        <div className="flex items-center gap-2 bg-[#c9a84c]/10 rounded-lg px-3 py-2">
                          <RefreshCw className="w-3.5 h-3.5 text-[#c9a84c]" />
                          <p className="text-xs text-[#c9a84c] font-medium">
                            Dosya numarası girildi — UYAP otomatik senkronize edilecek
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notlar" rows={2}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={resetModal}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-[#c9a84c] text-white text-sm font-semibold hover:bg-[#e7b743] disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</> : "Kaydet & Senkronize Et"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Belge Talep Modal ───────────────────────────────────────────────── */}
      {talepClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeTalepModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                  <FileUp className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-[#0f1729]">Müvekkilden Belge İste</h3>
                  <p className="text-[10px] text-gray-400">Güvenli yükleme linki gönder</p>
                </div>
              </div>
              <button onClick={closeTalepModal} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            {!talepResult ? (
              <>
                <div className="bg-[#f4f5f7] rounded-xl px-4 py-3 mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Müvekkil</p>
                  <p className="text-sm font-semibold text-[#0f1729]">{talepClient.full_name}</p>
                  {talepClient.phone && <p className="text-xs text-gray-500 font-mono">{talepClient.phone}</p>}
                </div>

                {allCases.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">İlişkili Dava</label>
                    <select value={talepCaseId} onChange={(e) => setTalepCaseId(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#c9a84c] bg-white">
                      <option value="">Dava seçin (isteğe bağlı)</option>
                      {allCases.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}{c.case_number ? ` (${c.case_number})` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mesaj</label>
                  <textarea value={talepMessage} onChange={(e) => setTalepMessage(e.target.value)}
                    rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
                </div>

                <div className="flex gap-3">
                  <button onClick={closeTalepModal}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
                  <button onClick={sendBelgeTalep} disabled={talepLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#c9a84c] text-white text-sm font-semibold hover:bg-[#e7b743] disabled:opacity-50 flex items-center justify-center gap-2">
                    {talepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Gönder</>}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-green-700">Bağlantı oluşturuldu</p>
                </div>
                <div className={`flex items-start gap-2 rounded-xl px-4 py-3 mb-4 ${talepResult.smsSent ? "bg-green-50" : "bg-yellow-50"}`}>
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${talepResult.smsSent ? "text-green-600" : "text-yellow-600"}`} />
                  <div>
                    {talepResult.smsSent ? (
                      <p className="text-xs text-green-700">SMS {talepClient.phone} numarasına gönderildi</p>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-yellow-700">SMS gönderilemedi</p>
                        <p className="text-[10px] text-yellow-600 mt-0.5">{talepResult.smsError}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-[#f4f5f7] rounded-xl px-3 py-2.5 mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 mb-1">Yükleme Linki</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#0f1729] font-mono flex-1 truncate">{talepResult.uploadLink}</p>
                    <button onClick={() => copyLink(talepResult.uploadLink)} className="text-[#c9a84c] hover:text-[#e7b743] flex-shrink-0">
                      {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={talepResult.uploadLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <button onClick={closeTalepModal}
                  className="w-full py-2.5 rounded-xl bg-[#0f1729] text-white text-sm font-semibold hover:bg-[#1a2744] transition-colors">
                  Tamam
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client Detay Alt Paneli ────────────────────────────────────────────────────

function ClientDetail({ client }: { client: ClientWithData }) {
  const [openDavaId, setOpenDavaId] = useState<string | null>(null);

  return (
    <div className="px-5 pb-5 bg-[#f9f9f9] border-t border-gray-100">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 mb-4">
        {client.tc_no && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">TC Kimlik</p>
            <p className="text-xs text-gray-700 font-mono">{client.tc_no}</p>
          </div>
        )}
        {client.vekalet_no && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Vekalet No</p>
            <p className="text-xs text-gray-700">{client.vekalet_no}</p>
          </div>
        )}
        {client.dosya_no && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Dosya / Esas No</p>
            <p className="text-xs text-gray-700 font-mono">{client.dosya_no}</p>
          </div>
        )}
        {client.noter && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Noter</p>
            <p className="text-xs text-gray-700">{client.noter}</p>
          </div>
        )}
        {client.vekalet_tarihi && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Vekalet Tarihi</p>
            <p className="text-xs text-gray-700">{new Date(client.vekalet_tarihi).toLocaleDateString("tr-TR")}</p>
          </div>
        )}
        {client.address && (
          <div className="col-span-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Adres</p>
            <p className="text-xs text-gray-700">{client.address}</p>
          </div>
        )}
        {client.notes && (
          <div className="col-span-2 sm:col-span-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Notlar</p>
            <p className="text-xs text-gray-700">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Davalar */}
      {client.davalar.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" /> Davalar ({client.davalar.length})
          </p>
          <div className="space-y-2">
            {client.davalar.map((dava) => {
              const isOpen = openDavaId === dava.id;
              const belgeler = client.belgeler[dava.id] ?? [];
              return (
                <div key={dava.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenDavaId(isOpen ? null : dava.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#0f1729]">{dava.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {dava.case_number && (
                          <span className="text-[10px] text-gray-400 font-mono">{dava.case_number}</span>
                        )}
                        {dava.court && (
                          <span className="text-[10px] text-gray-400">{dava.court}</span>
                        )}
                        {dava.status && (
                          <span className="text-[10px] font-semibold text-[#c9a84c] bg-[#c9a84c]/10 px-1.5 py-0.5 rounded-full">
                            {dava.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {belgeler.length > 0 && (
                        <span className="text-[10px] text-gray-400">{belgeler.length} belge</span>
                      )}
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-50 px-4 py-3">
                      {belgeler.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Belgeler
                          </p>
                          {belgeler.map((b) => (
                            <div key={b.id} className="flex items-center gap-3 py-1.5">
                              <div className="w-6 h-6 rounded bg-[#0f1729]/5 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-3 h-3 text-[#0f1729]/50" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#0f1729] truncate">{b.ad}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400">{b.tur}</span>
                                  <span className="text-[10px] text-gray-300">·</span>
                                  <span className="text-[10px] text-gray-400">{b.boyut}</span>
                                  <span className="text-[10px] text-gray-300">·</span>
                                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                    <Calendar className="w-2.5 h-2.5" />{new Date(b.tarih).toLocaleDateString("tr-TR")}
                                  </span>
                                </div>
                              </div>
                              <button className="text-gray-300 hover:text-[#c9a84c] transition-colors flex-shrink-0" title="İndir">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2">Bu dava için henüz belge yok.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-3">
        Kayıt tarihi: {new Date(client.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
