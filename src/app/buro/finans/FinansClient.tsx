"use client";

import { useState, useMemo, Fragment } from "react";
import { Plus, X, TrendingUp, TrendingDown, Download, CheckCircle, Clock, XCircle, RotateCcw, BarChart2, ChevronDown, ChevronRight, Layers } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  provider: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

interface FinansClientProps {
  initialPayments: Payment[];
}

interface FormData {
  amount: string;
  currency: string;
  status: string;
  description: string;
  taksitli: boolean;
  taksit_sayisi: number;
  taksit_aralik: "haftalik" | "aylik";
}

const EMPTY_FORM: FormData = {
  amount: "",
  currency: "TRY",
  status: "success",
  description: "",
  taksitli: false,
  taksit_sayisi: 3,
  taksit_aralik: "aylik",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  success: { label: "Ödendi", color: "bg-green-100 text-green-800", icon: CheckCircle },
  pending: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  failed: { label: "İptal", color: "bg-red-100 text-red-700", icon: XCircle },
  refunded: { label: "İade", color: "bg-gray-100 text-gray-600", icon: RotateCcw },
};

function formatCurrency(amount: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount);
}

// Taksit deseni: "Duruşma Masrafları (2/6)" → temel ad + sıra + toplam
const TAKSIT_RE = /^(.*?)\s*\((\d+)\/(\d+)\)\s*$/;

interface PaymentGroup {
  key: string;
  description: string;
  items: Payment[];
  isTaksit: boolean;
  totalAmount: number;
  paidCount: number;
  totalCount: number;
  currency: string;
  latestDate: string;
}

// Taksitli ödemeleri tek satırda topla (açıklama + toplam taksit sayısına göre)
function groupPayments(payments: Payment[]): PaymentGroup[] {
  const groups = new Map<string, PaymentGroup>();
  const order: string[] = [];

  for (const p of payments) {
    const m = p.description?.match(TAKSIT_RE);
    if (m) {
      const base = m[1].trim() || "Taksitli Ödeme";
      const total = parseInt(m[3], 10);
      const key = `taksit:${base}:${total}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key, description: base, items: [], isTaksit: true,
          totalAmount: 0, paidCount: 0, totalCount: total,
          currency: p.currency, latestDate: p.created_at,
        });
        order.push(key);
      }
      const g = groups.get(key)!;
      g.items.push(p);
      g.totalAmount += p.amount;
      if (p.status === "success") g.paidCount += 1;
    } else {
      const key = `tek:${p.id}`;
      groups.set(key, {
        key, description: p.description ?? "", items: [p], isTaksit: false,
        totalAmount: p.amount, paidCount: p.status === "success" ? 1 : 0,
        totalCount: 1, currency: p.currency, latestDate: p.created_at,
      });
      order.push(key);
    }
  }

  // Taksitleri sıra numarasına göre diz
  for (const g of Array.from(groups.values())) {
    if (g.isTaksit) {
      g.items.sort((a: Payment, b: Payment) => {
        const ai = parseInt(a.description?.match(TAKSIT_RE)?.[2] ?? "0", 10);
        const bi = parseInt(b.description?.match(TAKSIT_RE)?.[2] ?? "0", 10);
        return ai - bi;
      });
    }
  }

  return order.map((k) => groups.get(k)!);
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
}

export default function FinansClient({ initialPayments }: FinansClientProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [statusFilter, setStatusFilter] = useState("tumu");

  const filtered = payments.filter(
    (p) => statusFilter === "tumu" || p.status === statusFilter
  );

  // Taksitli kayıtlar tek satırda gruplanır; tıklayınca detay açılır
  const groupedPayments = useMemo(() => groupPayments(filtered), [filtered]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Özet hesapları
  const totalSuccess = payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  const now = new Date();
  const thisMonthKey = getMonthKey(now.toISOString());
  const lastMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString());

  const thisMonth = payments.filter((p) => getMonthKey(p.created_at) === thisMonthKey && p.status === "success").reduce((s, p) => s + p.amount, 0);
  const lastMonth = payments.filter((p) => getMonthKey(p.created_at) === lastMonthKey && p.status === "success").reduce((s, p) => s + p.amount, 0);
  const monthChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  // 6 aylık grafik verisi
  const chartData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(getMonthKey(d.toISOString()));
    }
    return months.map((key) => ({
      key,
      label: getMonthLabel(key),
      total: payments.filter((p) => getMonthKey(p.created_at) === key && p.status === "success").reduce((s, p) => s + p.amount, 0),
      pending: payments.filter((p) => getMonthKey(p.created_at) === key && p.status === "pending").reduce((s, p) => s + p.amount, 0),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments]);

  const maxChartVal = Math.max(...chartData.map((d) => d.total + d.pending), 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) { setFormError("Geçerli bir tutar giriniz."); return; }

    setSaving(true);
    try {
      if (formData.taksitli) {
        const taksitTutar = amt / formData.taksit_sayisi;
        const newPayments: Payment[] = [];
        for (let i = 0; i < formData.taksit_sayisi; i++) {
          const dueDate = new Date();
          if (formData.taksit_aralik === "haftalik") dueDate.setDate(dueDate.getDate() + 7 * i);
          else dueDate.setMonth(dueDate.getMonth() + i);

          const res = await fetch("/api/buro/finans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: Math.round(taksitTutar * 100) / 100,
              currency: formData.currency,
              status: i === 0 ? formData.status : "pending",
              description: `${formData.description || "Taksit"} (${i + 1}/${formData.taksit_sayisi})`,
              due_date: dueDate.toISOString(),
            }),
          });
          const data = await res.json() as { payment?: Payment; error?: string };
          if (!res.ok || !data.payment) { setFormError(data.error ?? "Hata"); return; }
          newPayments.push(data.payment);
        }
        setPayments((prev) => [...newPayments, ...prev]);
      } else {
        const res = await fetch("/api/buro/finans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, amount: amt }),
        });
        const data = await res.json() as { payment?: Payment; error?: string };
        if (!res.ok || !data.payment) { setFormError(data.error || "Bir hata oluştu"); return; }
        setPayments((prev) => [data.payment!, ...prev]);
      }
      setShowModal(false);
      setFormData(EMPTY_FORM);
    } catch {
      setFormError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const rows = [
      ["Tarih", "Açıklama", "Tutar", "Para Birimi", "Durum"],
      ...filtered.map((p) => [
        new Date(p.created_at).toLocaleDateString("tr-TR"),
        p.description || "",
        p.amount.toString(),
        p.currency,
        STATUS_CONFIG[p.status]?.label || p.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mizanim-finans-${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-green-50">
          <p className="font-body text-xs text-muted-foreground mb-1">Toplam Tahsilat</p>
          <p className="font-heading text-2xl font-bold text-green-700">{formatCurrency(totalSuccess)}</p>
        </div>
        <div className="card bg-yellow-50">
          <p className="font-body text-xs text-muted-foreground mb-1">Bekleyen</p>
          <p className="font-heading text-2xl font-bold text-yellow-700">{formatCurrency(totalPending)}</p>
        </div>
        <div className="card bg-primary/5">
          <p className="font-body text-xs text-muted-foreground mb-1">Bu Ay</p>
          <div className="flex items-end gap-2">
            <p className="font-heading text-2xl font-bold text-primary">{formatCurrency(thisMonth)}</p>
            {lastMonth > 0 && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold mb-1 ${monthChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                {monthChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(monthChange).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 6 aylık grafik */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-primary" />
          <p className="font-heading text-sm font-bold text-primary">Son 6 Ay</p>
          <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary/70 inline-block" />Tahsilat</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-300 inline-block" />Bekleyen</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {chartData.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: "88px" }}>
                {d.total > 0 && (
                  <div
                    className={`w-full rounded-t-sm transition-all ${d.key === thisMonthKey ? "bg-primary" : "bg-primary/50"}`}
                    style={{ height: `${Math.max(4, (d.total / maxChartVal) * 80)}px` }}
                    title={formatCurrency(d.total)}
                  />
                )}
                {d.pending > 0 && (
                  <div
                    className="w-full bg-yellow-300 rounded-t-sm"
                    style={{ height: `${Math.max(3, (d.pending / maxChartVal) * 80)}px` }}
                    title={formatCurrency(d.pending)}
                  />
                )}
                {d.total === 0 && d.pending === 0 && (
                  <div className="w-full bg-gray-100 rounded-t-sm" style={{ height: "4px" }} />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {["tumu", "success", "pending", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-white text-muted-foreground border border-border hover:border-primary"
              }`}
            >
              {s === "tumu" ? "Tümü" : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-outline flex items-center gap-2 text-sm py-2">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => { setShowModal(true); setFormData(EMPTY_FORM); setFormError(""); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Yeni Ödeme
          </button>
        </div>
      </div>

      {/* Payments list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-lg font-bold text-primary">Kayıt bulunamadı</p>
          <p className="font-body text-sm text-muted-foreground mt-1">Yeni ödeme eklemek için butona tıklayın.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary/5 border-b border-border">
              <tr>
                <th className="font-body text-xs font-semibold text-muted-foreground text-left px-4 py-3">Tarih</th>
                <th className="font-body text-xs font-semibold text-muted-foreground text-left px-4 py-3">Açıklama</th>
                <th className="font-body text-xs font-semibold text-muted-foreground text-right px-4 py-3">Tutar</th>
                <th className="font-body text-xs font-semibold text-muted-foreground text-center px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupedPayments.map((group) => {
                // Tek kayıt — normal satır
                if (!group.isTaksit) {
                  const payment = group.items[0];
                  const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={group.key} className="hover:bg-primary/5 transition-colors">
                      <td className="font-body text-sm text-muted-foreground px-4 py-3 whitespace-nowrap">
                        {new Date(payment.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="font-body text-sm text-foreground px-4 py-3">
                        {payment.description || <span className="text-muted-foreground italic">—</span>}
                      </td>
                      <td className="font-heading text-sm font-bold text-right px-4 py-3 whitespace-nowrap">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                }

                // Taksitli grup — tek satır + accordion
                const isOpen = expandedGroups.has(group.key);
                const done = group.paidCount >= group.totalCount;
                return (
                  <Fragment key={group.key}>
                    <tr
                      onClick={() => toggleGroup(group.key)}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <td className="font-body text-sm text-muted-foreground px-4 py-3 whitespace-nowrap">
                        {new Date(group.latestDate).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="font-body text-sm text-foreground px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          <Layers className="w-3.5 h-3.5 text-primary/60" />
                          {group.description || <span className="text-muted-foreground italic">Taksitli Ödeme</span>}
                        </span>
                      </td>
                      <td className="font-heading text-sm font-bold text-right px-4 py-3 whitespace-nowrap">
                        {formatCurrency(group.totalAmount, group.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium ${
                          done ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          <Layers className="w-3 h-3" />
                          Taksitli {group.paidCount}/{group.totalCount}
                        </span>
                      </td>
                    </tr>
                    {isOpen && group.items.map((payment) => {
                      const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <tr key={payment.id} className="bg-primary/[0.03]">
                          <td className="font-body text-xs text-muted-foreground px-4 py-2 whitespace-nowrap pl-8">
                            {new Date(payment.created_at).toLocaleDateString("tr-TR")}
                          </td>
                          <td className="font-body text-xs text-muted-foreground px-4 py-2 pl-10">
                            {payment.description}
                          </td>
                          <td className="font-body text-xs font-semibold text-right px-4 py-2 whitespace-nowrap text-muted-foreground">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${statusCfg.color}`}>
                              <StatusIcon className="w-2.5 h-2.5" />
                              {statusCfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-background rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-primary">Yeni Ödeme Kaydı</h2>
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
                  Tutar (₺) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" step="0.01" min="0.01"
                  className="input-field w-full"
                  placeholder="1.500,00"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  required
                />
              </div>

              {/* Taksit toggle */}
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, taksitli: !p.taksitli }))}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${formData.taksitli ? "bg-primary" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.taksitli ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <div className="flex-1">
                  <p className="font-body text-sm font-medium text-foreground">Taksitli Ödeme</p>
                  {formData.taksitli && formData.amount && (
                    <p className="font-body text-xs text-muted-foreground">
                      Her taksit: {formatCurrency(parseFloat(formData.amount || "0") / formData.taksit_sayisi)}
                    </p>
                  )}
                </div>
              </div>

              {formData.taksitli && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Taksit Sayısı</label>
                    <select
                      className="input-field w-full"
                      value={formData.taksit_sayisi}
                      onChange={(e) => setFormData((p) => ({ ...p, taksit_sayisi: parseInt(e.target.value) }))}
                    >
                      {[2, 3, 4, 6, 9, 12].map((n) => (
                        <option key={n} value={n}>{n} taksit</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Ödeme Aralığı</label>
                    <select
                      className="input-field w-full"
                      value={formData.taksit_aralik}
                      onChange={(e) => setFormData((p) => ({ ...p, taksit_aralik: e.target.value as "haftalik" | "aylik" }))}
                    >
                      <option value="haftalik">Haftalık</option>
                      <option value="aylik">Aylık</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Durum</label>
                <select
                  className="input-field w-full"
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="success">Ödendi</option>
                  <option value="pending">Bekliyor</option>
                  <option value="failed">İptal</option>
                </select>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Açıklama</label>
                <textarea
                  className="input-field w-full resize-none"
                  placeholder="Avukat vekalet ücreti, duruşma masrafı vb..."
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
                      {formData.taksitli ? "Taksitler oluşturuluyor..." : "Kaydediliyor..."}
                    </span>
                  ) : formData.taksitli ? `${formData.taksit_sayisi} Taksit Oluştur` : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
