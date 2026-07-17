"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, X, FolderOpen, Building2,
  LayoutList, LayoutGrid, RefreshCw,
  Loader2, ChevronRight, MoreHorizontal,
  Calendar, User, Scale, AlertCircle, Check,
} from "lucide-react";

interface Client {
  id: string;
  full_name: string;
}

interface CaseRow {
  id: string;
  title: string;
  case_number: string | null;
  court: string | null;
  status: string;
  description: string | null;
  opposing_party: string | null;
  created_at: string;
  clients: Client | null;
  client_name?: string | null;
}

interface Props {
  initialCases: CaseRow[];
  clients: Client[];
}

// DB statüsleri → görünen etiket mapping
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; card: string }> = {
  aktif:          { label: "Açık",             color: "bg-orange-100 text-orange-700",  dot: "bg-orange-400",  card: "bg-orange-500" },
  beklemede:      { label: "Beklemede",         color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400",  card: "bg-yellow-500" },
  istinaf_temyiz: { label: "İstinaf/Temyiz",   color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500",    card: "bg-blue-500"   },
  kapatildi:      { label: "Kapalı",            color: "bg-gray-100 text-gray-600",     dot: "bg-gray-400",    card: "bg-gray-400"   },
  arsiv:          { label: "Arşiv",             color: "bg-gray-100 text-gray-500",     dot: "bg-gray-300",    card: "bg-gray-300"   },
};

const STATUS_ORDER = ["aktif", "beklemede", "istinaf_temyiz", "kapatildi"];

const YARG_TURLERI = [
  "Tüm Yargı Türleri", "Hukuk", "Ceza", "İdare", "Vergi", "İş",
  "Aile", "Ticaret", "İcra", "Anayasa",
];

const EMPTY_FORM = {
  title: "", client_id: "", client_name: "", case_number: "", court: "",
  status: "aktif", description: "", opposing_party: "",
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.aktif;
}

function getCaseInitials(title: string) {
  return title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function DosyaYonetimiClient({ initialCases, clients }: Props) {
  const router = useRouter();
  const [cases, setCases] = useState<CaseRow[]>(initialCases);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tumu");
  const [yargFilter, setYargFilter] = useState("Tüm Yargı Türleri");
  const [sort, setSort] = useState("en_yeni");
  const [viewMode, setViewMode] = useState<"liste" | "kart">("liste");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uyapLoading, setUyapLoading] = useState(false);
  const [uyapMsg, setUyapMsg] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Sayım
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = cases.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // Filtrele
  const filtered = cases
    .filter((c) => {
      if (statusFilter !== "tumu" && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.title.toLowerCase().includes(q) &&
          !(c.case_number ?? "").includes(q) &&
          !(c.court ?? "").toLowerCase().includes(q) &&
          !(c.clients?.full_name ?? "").toLowerCase().includes(q) &&
          !(c.client_name ?? "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "en_yeni") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "en_eski") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return a.title.localeCompare(b.title, "tr");
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formData.title.trim()) { setFormError("Dava başlığı zorunludur."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/buro/davalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json() as { case?: CaseRow; error?: string };
      if (!res.ok || data.error) { setFormError(data.error ?? "Hata oluştu."); return; }
      if (data.case) setCases((prev) => [data.case!, ...prev]);
      setShowModal(false);
      setFormData(EMPTY_FORM);
    } catch { setFormError("Bağlantı hatası."); }
    finally { setSaving(false); }
  }

  async function handleUyapSync() {
    setUyapLoading(true);
    setUyapMsg("");
    // Demo: UYAP gerçek API olmadığı için simüle et
    await new Promise((r) => setTimeout(r, 1500));
    setUyapMsg("UYAP bağlantısı için e-imza / UETS kimlik bilgileri gereklidir. Entegrasyon yakında aktif olacak.");
    setUyapLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/buro/dava/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setCases((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    setOpenMenu(null);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0f1729]">Dosya Yönetimi</h1>
            <p className="text-sm text-gray-400 mt-0.5">{cases.length} dosya</p>
          </div>
          <div className="flex items-center gap-2">
            {uyapMsg && (
              <p className="text-xs text-gray-500 max-w-xs">{uyapMsg}</p>
            )}
            <button
              onClick={handleUyapSync}
              disabled={uyapLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              {uyapLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              UYAP Senkronizasyon
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#c9a84c] text-white hover:bg-[#e7b743] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Dosya
            </button>
          </div>
        </div>

        {/* Durum Kartları */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {STATUS_ORDER.map((s) => {
            const cfg = getStatusConfig(s);
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(isActive ? "tumu" : s)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  isActive
                    ? "border-[#c9a84c] bg-[#c9a84c]/5 shadow-sm"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${cfg.card} flex items-center justify-center flex-shrink-0`}>
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-heading text-xl font-bold text-[#0f1729]">{counts[s] ?? 0}</p>
                  <p className="text-xs text-gray-400">{cfg.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Araç çubuğu */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Dosya ara... (No, mahkeme, müvekkil, esas no)"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#c9a84c] bg-[#f9f9f9]"
          />
        </div>
        <select value={yargFilter} onChange={(e) => setYargFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c]">
          {YARG_TURLERI.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-600 bg-white focus:outline-none focus:border-[#c9a84c]">
          <option value="en_yeni">En Yeni</option>
          <option value="en_eski">En Eski</option>
          <option value="alfabetik">Alfabetik</option>
        </select>
      </div>

      {/* Liste/Kart ve sayı */}
      <div className="px-6 py-3 flex items-center justify-between flex-shrink-0">
        <p className="text-sm text-gray-500">
          <strong className="text-[#0f1729]">{filtered.length}</strong> dosya gösteriliyor
        </p>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setViewMode("liste")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "liste" ? "bg-[#0f1729] text-white" : "text-gray-400 hover:text-gray-600"}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("kart")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "kart" ? "bg-[#0f1729] text-white" : "text-gray-400 hover:text-gray-600"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 px-6 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-heading text-base font-bold text-[#0f1729] mb-1">Dosya bulunamadı</p>
            <p className="text-sm text-gray-400">
              {search ? "Arama kriterlerini değiştirin" : "Henüz dava eklenmemiş"}
            </p>
            {!search && (
              <button onClick={() => setShowModal(true)}
                className="mt-4 flex items-center gap-2 bg-[#c9a84c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#e7b743] transition-colors">
                <Plus className="w-4 h-4" /> İlk Dosyayı Ekle
              </button>
            )}
          </div>
        ) : viewMode === "liste" ? (
          /* LİSTE GÖRÜNÜM */
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Tablo başlık */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Dosya / Esas No</span>
              <span>Mahkeme</span>
              <span>Müvekkil / Karşı Taraf</span>
              <span>Tarih</span>
              <span />
            </div>
            {filtered.map((c) => {
              const cfg = getStatusConfig(c.status);
              return (
                <div
                  key={c.id}
                  className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 items-center px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer"
                  onClick={() => router.push(`/buro/dava/${c.id}`)}
                >
                  {/* Dosya adı */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${cfg.card} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}>
                      {getCaseInitials(c.title)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f1729] truncate group-hover:text-[#c9a84c] transition-colors">
                        {c.title}
                      </p>
                      {c.case_number && (
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{c.case_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Mahkeme */}
                  <div className="min-w-0">
                    {c.court ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{c.court}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Müvekkil / Karşı Taraf */}
                  <div className="min-w-0">
                    {(c.clients || c.client_name) && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <User className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{c.clients?.full_name ?? c.client_name}</span>
                      </div>
                    )}
                    {c.opposing_party && (
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-400 truncate">{c.opposing_party}</span>
                      </div>
                    )}
                  </div>

                  {/* Tarih + Durum */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Menü */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                      className="p-2 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenu === c.id && (
                      <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-xl py-1 w-44">
                        <button onClick={() => router.push(`/buro/dava/${c.id}`)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                          <ChevronRight className="w-3.5 h-3.5" /> Dosyayı Aç
                        </button>
                        <div className="border-t border-gray-50 my-1" />
                        {Object.entries(STATUS_CONFIG).slice(0, 4).map(([s, cfg2]) => (
                          <button key={s} onClick={() => updateStatus(c.id, s)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                            {c.status === s && <Check className="w-3 h-3 text-green-500" />}
                            {c.status !== s && <span className={`w-2 h-2 rounded-full ${cfg2.dot}`} />}
                            {cfg2.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* KART GÖRÜNÜM */
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const cfg = getStatusConfig(c.status);
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/buro/dava/${c.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer p-5 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${cfg.card} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {getCaseInitials(c.title)}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <h3 className="font-heading text-sm font-bold text-[#0f1729] mb-1 group-hover:text-[#c9a84c] transition-colors line-clamp-2">
                    {c.title}
                  </h3>
                  {c.case_number && (
                    <p className="text-[10px] font-mono text-gray-400 mb-2">{c.case_number}</p>
                  )}
                  <div className="space-y-1">
                    {c.court && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-500 truncate">{c.court}</span>
                      </div>
                    )}
                    {(c.clients || c.client_name) && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-500 truncate">{c.clients?.full_name ?? c.client_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {/* Finans'a çapraz geçiş — ödeme bu dosya + müvekkille ön-ilişkilendirilir */}
                    <a
                      href={`/buro/finans?case=${c.id}&caseTitle=${encodeURIComponent(c.case_number || c.title)}${c.clients ? `&client=${c.clients.id}&clientName=${encodeURIComponent(c.clients.full_name)}` : ""}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
                    >
                      ₺ Finans
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Yeni Dosya Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-lg font-bold text-[#0f1729]">Yeni Dosya Ekle</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-600">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dava Başlığı *</label>
                <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Kıdem Tazminatı Davası" className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Müvekkil <span className="text-gray-300">(isteğe bağlı)</span>
                  </label>
                  <select value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value, client_name: e.target.value ? "" : formData.client_name })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] bg-white">
                    <option value="">Seçin / Müvekkilsiz</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                  {!formData.client_id && (
                    <input value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="veya manuel isim-soyisim yazın"
                      className="mt-2 w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Durum</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] bg-white">
                    {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                      <option key={v} value={v}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Esas No</label>
                  <input value={formData.case_number} onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                    placeholder="2024/1234" className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mahkeme</label>
                  <input value={formData.court} onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                    placeholder="Asliye Hukuk Mahkemesi" className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Karşı Taraf</label>
                <input value={formData.opposing_party} onChange={(e) => setFormData({ ...formData, opposing_party: e.target.value })}
                  placeholder="Karşı taraf adı / unvanı" className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Açıklama</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3} placeholder="Dava hakkında notlar..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#c9a84c] text-white text-sm font-semibold hover:bg-[#e7b743] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FolderOpen className="w-4 h-4" /> Dosya Ekle</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menü dışı tıklama */}
      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
