"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, X, FolderOpen, Building2,
  LayoutList, LayoutGrid, RefreshCw,
  Loader2, ChevronRight, MoreHorizontal,
  Calendar, User, Scale, AlertCircle, Check,
  Eye, FileText, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";

interface Client {
  id: string;
  full_name: string;
}

interface UyapTaraf { rol?: string; tip?: string; ad?: string; vekil?: string; muvekkil?: boolean }
interface UyapEvrak { ad?: string; tarih?: string; klasor?: string }
interface UyapSafahat { tarih?: string; islem?: string; aciklama?: string }

interface CaseRow {
  id: string;
  title: string;
  case_number: string | null;
  court: string | null;
  status: string;
  case_type: string | null;
  description: string | null;
  opposing_party: string | null;
  created_at: string;
  clients: Client | null;
  client_name?: string | null;
  uyap_status?: string | null;
  uyap_acilis_tarihi?: string | null;
  opened_at?: string | null;
  uyap_taraflar?: UyapTaraf[] | null;
  uyap_evraklar?: UyapEvrak[] | null;
  uyap_safahat?: UyapSafahat[] | null;
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

// Dosya türü kategorileri (çip sırası). "Diğer" yalnız eşleşmeyen dosya varsa gösterilir.
const KATEGORILER = ["Ceza", "Hukuk", "İcra", "İdari Yargı", "Arabuluculuk"] as const;

// Dosya türü/mahkeme metninden yargı kategorisi çıkarır (case_type + court sinyalleri).
function davaKategorisi(c: CaseRow): string {
  const d = `${c.case_type ?? ""} ${c.court ?? ""} ${c.title ?? ""}`.toLocaleLowerCase("tr");
  if (/arabulucu/.test(d)) return "Arabuluculuk";
  if (/icra|iflas|haciz|i̇cra/.test(d)) return "İcra";
  if (/ceza|san[ıi]k|sav[cç][ıi]|soru[şs]turma|a[ğg][ıi]r ceza|asliye ceza|sulh ceza/.test(d)) return "Ceza";
  if (/idar[ei]|vergi|dan[ıi][şs]tay|b[öo]lge idare/.test(d)) return "İdari Yargı";
  if (/hukuk|aile|bo[şs]anma|i[şs] mahkeme|asliye|sulh hukuk|ticaret|t[üu]ketici|tazminat|alacak|k[ıi]dem|nafaka|velayet/.test(d)) return "Hukuk";
  return "Diğer";
}

// UYAP dosya durumu metni → rozet rengi (Açık yeşil / Kapalı gri / İstinafta mavi /
// Yargıtayda mor / Karara Çıkmış turuncu). uyap_status yoksa yerel status'ten türetilir.
function uyapDurumRozet(c: CaseRow): { label: string; cls: string } {
  const d = (c.uyap_status ?? "").toLocaleLowerCase("tr");
  if (/yarg[ıi]tay/.test(d)) return { label: c.uyap_status!, cls: "bg-purple-100 text-purple-700" };
  if (/istinaf/.test(d)) return { label: c.uyap_status!, cls: "bg-blue-100 text-blue-700" };
  if (/karar/.test(d)) return { label: c.uyap_status!, cls: "bg-orange-100 text-orange-700" };
  if (/kapal|kesinle/.test(d)) return { label: c.uyap_status!, cls: "bg-gray-100 text-gray-600" };
  if (/aç[ıi]k|derdest/.test(d)) return { label: c.uyap_status!, cls: "bg-green-100 text-green-700" };
  if (c.uyap_status) return { label: c.uyap_status, cls: "bg-gray-100 text-gray-600" };
  const cfg = getStatusConfig(c.status);
  return { label: cfg.label, cls: cfg.color };
}

// UYAP Dosya Açılış Tarihi (metin) yoksa opened_at/created_at gösterilir
function acilisGoster(c: CaseRow): string {
  if (c.uyap_acilis_tarihi) return c.uyap_acilis_tarihi;
  const t = c.opened_at ?? c.created_at;
  return new Date(t).toLocaleDateString("tr-TR");
}

// UYAP sütun tanımları: anahtar → başlık + satırdan değer (filtre/sıralama bunu kullanır)
const UYAP_SUTUNLAR: Array<{ key: string; label: string; deger: (c: CaseRow) => string }> = [
  { key: "birim",  label: "Birim",               deger: (c) => c.court ?? "" },
  { key: "no",     label: "Dosya No",            deger: (c) => c.case_number ?? "" },
  { key: "tur",    label: "Dosya Türü",          deger: (c) => c.case_type ?? "" },
  { key: "durum",  label: "Dosya Durumu",        deger: (c) => c.uyap_status ?? getStatusConfig(c.status).label },
  { key: "acilis", label: "Açılış Tarihi",       deger: (c) => acilisGoster(c) },
];

const SAYFA_BOYUTLARI = [10, 20, 50, 100, 0] as const; // 0 = Tümü

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
  const [kategoriFilter, setKategoriFilter] = useState("tumu");
  const [sort, setSort] = useState("en_yeni");
  const [viewMode, setViewMode] = useState<"liste" | "kart">("liste");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [kolonFiltre, setKolonFiltre] = useState<Record<string, string>>({});
  const [kolonSirala, setKolonSirala] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState<CaseRow | null>(null);

  // Sayım
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = cases.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // Kategori sayımları (çipler için) — yalnız var olan kategoriler gösterilir
  const kategoriCounts = cases.reduce((acc, c) => {
    const k = davaKategorisi(c);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const gorunenKategoriler = KATEGORILER.filter((k) => kategoriCounts[k]);
  if (kategoriCounts["Diğer"]) gorunenKategoriler.push("Diğer" as never);

  // Filtrele
  const filtered = cases
    .filter((c) => {
      if (statusFilter !== "tumu" && c.status !== statusFilter) return false;
      if (kategoriFilter !== "tumu" && davaKategorisi(c) !== kategoriFilter) return false;
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

  // UYAP tablosu: sütun filtreleri + sütun sıralaması + sayfalama
  const uyapFiltered = filtered
    .filter((c) => UYAP_SUTUNLAR.every((s) => {
      const f = (kolonFiltre[s.key] ?? "").toLocaleLowerCase("tr");
      return !f || s.deger(c).toLocaleLowerCase("tr").includes(f);
    }))
    .sort((a, b) => {
      if (!kolonSirala) return 0;
      const s = UYAP_SUTUNLAR.find((x) => x.key === kolonSirala.key);
      if (!s) return 0;
      return s.deger(a).localeCompare(s.deger(b), "tr") * kolonSirala.dir;
    });
  const toplamSayfa = pageSize === 0 ? 1 : Math.max(1, Math.ceil(uyapFiltered.length / pageSize));
  const guvenliPage = Math.min(page, toplamSayfa - 1);
  const sayfali = pageSize === 0 ? uyapFiltered : uyapFiltered.slice(guvenliPage * pageSize, (guvenliPage + 1) * pageSize);

  function toggleSirala(key: string) {
    setKolonSirala((prev) => prev?.key !== key ? { key, dir: 1 } : prev.dir === 1 ? { key, dir: -1 } : null);
  }

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
            <a
              href="/buro/uyap"
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors no-underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              UYAP&apos;tan Aktar
            </a>
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

        {/* Dosya türü sayaç çipleri */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setKategoriFilter("tumu")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              kategoriFilter === "tumu" ? "bg-[#0f1729] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Tümü {cases.length}
          </button>
          {gorunenKategoriler.map((k) => (
            <button
              key={k}
              onClick={() => setKategoriFilter(kategoriFilter === k ? "tumu" : k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                kategoriFilter === k ? "bg-[#c9a84c] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {k} {kategoriCounts[k]}
            </button>
          ))}
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
          /* LİSTE GÖRÜNÜM — UYAP dosya sorgulama düzeni */
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    {UYAP_SUTUNLAR.map((s) => (
                      <th key={s.key} className="px-4 py-2.5 align-top">
                        <button onClick={() => toggleSirala(s.key)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hover:text-[#c9a84c]">
                          {s.label}
                          {kolonSirala?.key === s.key
                            ? (kolonSirala.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                            : <ArrowUpDown className="w-3 h-3 text-gray-300" />}
                        </button>
                        <input
                          value={kolonFiltre[s.key] ?? ""}
                          onChange={(e) => { setKolonFiltre({ ...kolonFiltre, [s.key]: e.target.value }); setPage(0); }}
                          placeholder="Filtrele"
                          className="mt-1.5 w-full min-w-[90px] text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#c9a84c] bg-[#f9f9f9]"
                        />
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider align-top">Dosya Görüntüle</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider align-top">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {sayfali.map((c) => {
                    const rozet = uyapDurumRozet(c);
                    return (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/buro/dava/${c.id}`)}>
                        <td className="px-4 py-3 max-w-[260px]">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate">{c.court || "—"}</span>
                          </div>
                          {(c.clients || c.client_name) && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <User className="w-3 h-3 text-gray-300 flex-shrink-0" />
                              <span className="text-[11px] text-gray-500 truncate">{c.clients?.full_name ?? c.client_name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-[#0f1729] whitespace-nowrap">{c.case_number || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">{c.case_type || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${rozet.cls}`}>
                            {rozet.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{acilisGoster(c)}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setPreview(c)} title="Hızlı ön izleme"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#c9a84c] hover:bg-gray-100 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => router.push(`/buro/dava/${c.id}`)} title="Dosya detayı"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#c9a84c] hover:bg-gray-100 transition-colors">
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sayfalama: 10/20/50/100/Tümü */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
              <div className="flex items-center gap-1">
                {SAYFA_BOYUTLARI.map((b) => (
                  <button key={b} onClick={() => { setPageSize(b); setPage(0); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      pageSize === b ? "bg-[#0f1729] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>
                    {b === 0 ? "Tümü" : b}
                  </button>
                ))}
              </div>
              {pageSize !== 0 && toplamSayfa > 1 && (
                <div className="flex items-center gap-2">
                  <button disabled={guvenliPage === 0} onClick={() => setPage(guvenliPage - 1)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-600 disabled:opacity-40">‹</button>
                  <span className="text-[11px] text-gray-500">{guvenliPage + 1} / {toplamSayfa}</span>
                  <button disabled={guvenliPage >= toplamSayfa - 1} onClick={() => setPage(guvenliPage + 1)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-600 disabled:opacity-40">›</button>
                </div>
              )}
              <p className="text-[11px] text-gray-400">{uyapFiltered.length} dosya</p>
            </div>
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

      {/* Hızlı ön izleme (UYAP "Dosya Görüntüle" göz ikonu) */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-heading text-lg font-bold text-[#0f1729]">{preview.case_number || preview.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{preview.court}</p>
                <span className={`inline-flex mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${uyapDurumRozet(preview).cls}`}>
                  {uyapDurumRozet(preview).label}
                </span>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 mb-0.5">Dosya Türü</p>
                <p className="text-gray-700 font-medium">{preview.case_type || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 mb-0.5">Açılış Tarihi</p>
                <p className="text-gray-700 font-medium">{acilisGoster(preview)}</p>
              </div>
            </div>

            {(preview.uyap_taraflar?.length ?? 0) > 0 && (
              <div className="mb-4">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#0f1729] mb-2"><Scale className="w-3.5 h-3.5" /> Taraf Bilgileri</h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {preview.uyap_taraflar!.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0 text-xs">
                      <span className="text-gray-400 w-24 flex-shrink-0">{t.rol || "—"}</span>
                      <span className="text-gray-700 font-medium flex-1 truncate">{t.ad}</span>
                      {t.muvekkil && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">MÜVEKKİL</span>}
                      {t.vekil && <span className="text-[10px] text-gray-400 truncate max-w-[140px]">Vekil: {t.vekil}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(preview.uyap_safahat?.length ?? 0) > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-[#0f1729] mb-2">Son Safahat</h3>
                <div className="space-y-1">
                  {preview.uyap_safahat!.slice(0, 6).map((s, i) => (
                    <p key={i} className="text-[11px] text-gray-600"><span className="text-gray-400">{s.tarih}</span> {s.islem} {s.aciklama}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <p className="text-[11px] text-gray-400">{preview.uyap_evraklar?.length ?? 0} evrak kaydı</p>
              <button onClick={() => router.push(`/buro/dava/${preview.id}`)}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-[#c9a84c] text-white hover:bg-[#e7b743] transition-colors">
                <FileText className="w-3.5 h-3.5" /> Dosya Detayı
              </button>
            </div>
          </div>
        </div>
      )}

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
