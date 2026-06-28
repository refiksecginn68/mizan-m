"use client";

import { useState } from "react";
import {
  Search, Plus, X, User, Phone, Mail,
  FileUp, Copy, Check, Loader2, AlertCircle,
  Send, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  tc_no: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

interface Case {
  id: string;
  title: string;
  case_number?: string;
}

interface Props {
  initialClients: Client[];
  cases: Case[];
}

const EMPTY_FORM = {
  full_name: "", email: "", phone: "", tc_no: "", address: "", notes: "",
};

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

interface TalepModal {
  client: Client;
}

interface TalepResult {
  uploadLink: string;
  smsSent: boolean;
  smsError: string;
}

export default function MuvekkilYonetimClient({ initialClients, cases }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Yeni müvekkil modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Belge talep modal
  const [talepModal, setTalepModal] = useState<TalepModal | null>(null);
  const [talepCaseId, setTalepCaseId] = useState("");
  const [talepMessage, setTalepMessage] = useState("Davanıza ait belgeleri yüklemenizi rica ederiz.");
  const [talepLoading, setTalepLoading] = useState(false);
  const [talepResult, setTalepResult] = useState<TalepResult | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formData.full_name.trim()) { setFormError("Ad Soyad zorunludur."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/buro/muvekkiller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json() as { client?: Client; error?: string };
      if (!res.ok || data.error) { setFormError(data.error ?? "Hata"); return; }
      if (data.client) setClients((prev) => [data.client!, ...prev]);
      setShowAddModal(false);
      setFormData(EMPTY_FORM);
    } catch { setFormError("Bağlantı hatası."); }
    finally { setSaving(false); }
  }

  async function sendBelgeTalep() {
    if (!talepModal) return;
    setTalepLoading(true);
    setTalepResult(null);
    try {
      const res = await fetch("/api/buro/belge-talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: talepModal.client.id,
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

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function openTalepModal(client: Client) {
    setTalepModal({ client });
    setTalepCaseId("");
    setTalepMessage("Davanıza ait belgeleri yüklemenizi rica ederiz.");
    setTalepResult(null);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0">
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

        {/* Arama */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, telefon veya e-posta ara..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#c9a84c] bg-[#f9f9f9]"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 p-6">
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
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filtered.map((c, idx) => {
              const isExpanded = expandedId === c.id;
              return (
                <div key={c.id} className={idx > 0 ? "border-t border-gray-50" : ""}>
                  <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full ${getColor(c.full_name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {getInitials(c.full_name)}
                    </div>

                    {/* Bilgi */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0f1729]">{c.full_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3" />{c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />{c.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openTalepModal(c)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
                        title="Müvekkilden belge iste"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        Belge İste
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Detay */}
                  {isExpanded && (
                    <div className="px-5 pb-4 bg-[#f9f9f9] border-t border-gray-50">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {c.tc_no && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">TC Kimlik</p>
                            <p className="text-xs text-gray-700 font-mono">{c.tc_no}</p>
                          </div>
                        )}
                        {c.address && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Adres</p>
                            <p className="text-xs text-gray-700">{c.address}</p>
                          </div>
                        )}
                        {c.notes && (
                          <div className="col-span-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Notlar</p>
                            <p className="text-xs text-gray-700">{c.notes}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        Eklenme: {new Date(c.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Yeni Müvekkil Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-lg font-bold text-[#0f1729]">Yeni Müvekkil</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-xs text-red-600">{formError}</p>
              </div>
            )}
            <form onSubmit={handleAddClient} className="space-y-3">
              <input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ad Soyad *" className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
              <div className="grid grid-cols-2 gap-3">
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Telefon" className="text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
                <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="E-posta" className="text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
              </div>
              <input value={formData.tc_no} onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
                placeholder="TC Kimlik No" className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
              <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adres" rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notlar" rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#c9a84c] text-white text-sm font-semibold hover:bg-[#e7b743] disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Belge Talep Modal */}
      {talepModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setTalepModal(null); setTalepResult(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                  <FileUp className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-[#0f1729]">Müvekkilden Bilgi İste</h3>
                  <p className="text-[10px] text-gray-400">Belge yükleme linki gönderimi</p>
                </div>
              </div>
              <button onClick={() => { setTalepModal(null); setTalepResult(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!talepResult ? (
              <>
                {/* Müvekkil bilgisi */}
                <div className="bg-[#f4f5f7] rounded-xl px-4 py-3 mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 mb-1">Müvekkil Bilgisi</p>
                  <p className="text-sm font-semibold text-[#0f1729]">{talepModal.client.full_name}</p>
                  {talepModal.client.phone && (
                    <p className="text-xs text-gray-500 font-mono">{talepModal.client.phone}</p>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  <strong>{talepModal.client.full_name}</strong> isimli müvekkile belge yükleyebileceği güvenli bir bağlantı SMS ile gönderilecektir.
                </p>

                {/* Dava seç */}
                {cases.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">İlişkili Dava (isteğe bağlı)</label>
                    <select value={talepCaseId} onChange={(e) => setTalepCaseId(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#c9a84c] bg-white">
                      <option value="">Dava seçin</option>
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}{c.case_number ? ` (${c.case_number})` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mesaj */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mesaj</label>
                  <textarea value={talepMessage} onChange={(e) => setTalepMessage(e.target.value)}
                    rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setTalepModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    İptal
                  </button>
                  <button onClick={sendBelgeTalep} disabled={talepLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#c9a84c] text-white text-sm font-semibold hover:bg-[#e7b743] disabled:opacity-50 flex items-center justify-center gap-2">
                    {talepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Gönder</>}
                  </button>
                </div>
              </>
            ) : (
              /* Sonuç */
              <div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-green-700">Bağlantı oluşturuldu</p>
                </div>

                {/* SMS durumu */}
                <div className={`flex items-start gap-2 rounded-xl px-4 py-3 mb-4 ${talepResult.smsSent ? "bg-green-50" : "bg-yellow-50"}`}>
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${talepResult.smsSent ? "text-green-600" : "text-yellow-600"}`} />
                  <div>
                    {talepResult.smsSent ? (
                      <p className="text-xs text-green-700">SMS {talepModal.client.phone} numarasına gönderildi</p>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-yellow-700">SMS gönderilemedi</p>
                        <p className="text-[10px] text-yellow-600 mt-0.5">{talepResult.smsError}</p>
                        <p className="text-[10px] text-yellow-600 mt-1">Linki kopyalayıp manuel iletebilirsiniz.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Link */}
                <div className="bg-[#f4f5f7] rounded-xl px-3 py-2.5 mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 mb-1">Yükleme Linki</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#0f1729] font-mono flex-1 truncate">{talepResult.uploadLink}</p>
                    <button onClick={() => copyLink(talepResult.uploadLink)}
                      className="text-[#c9a84c] hover:text-[#e7b743] flex-shrink-0">
                      {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={talepResult.uploadLink} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <button onClick={() => { setTalepModal(null); setTalepResult(null); }}
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
