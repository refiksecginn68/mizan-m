"use client";

import { useState } from "react";
import { Plus, X, TrendingUp, Download, CheckCircle, Clock, XCircle } from "lucide-react";

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
}

const EMPTY_FORM: FormData = {
  amount: "",
  currency: "TRY",
  status: "success",
  description: "",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  success: { label: "Ödendi", color: "bg-green-100 text-green-800", icon: CheckCircle },
  pending: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  failed: { label: "İptal", color: "bg-red-100 text-red-700", icon: XCircle },
  refunded: { label: "İade", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

function formatCurrency(amount: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount);
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

  // Summary calculations
  const totalSuccess = payments
    .filter((p) => p.status === "success")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);
  const thisMonth = payments
    .filter((p) => {
      const d = new Date(p.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === "success";
    })
    .reduce((s, p) => s + p.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) { setFormError("Geçerli bir tutar giriniz."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/buro/finans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Bir hata oluştu"); return; }
      setPayments((prev) => [data.payment, ...prev]);
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
        {[
          { label: "Toplam Tahsilat", value: totalSuccess, color: "text-green-700", bg: "bg-green-50" },
          { label: "Bekleyen", value: totalPending, color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "Bu Ay", value: thisMonth, color: "text-primary", bg: "bg-primary/5" },
        ].map((card) => (
          <div key={card.label} className={`card ${card.bg}`}>
            <p className="font-body text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`font-heading text-2xl font-bold ${card.color}`}>
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
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
          <button
            onClick={handleExport}
            className="btn-outline flex items-center gap-2 text-sm py-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => { setShowModal(true); setFormData(EMPTY_FORM); setFormError(""); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni Ödeme
          </button>
        </div>
      </div>

      {/* Payments list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-lg font-bold text-primary">Kayıt bulunamadı</p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Yeni ödeme eklemek için butona tıklayın.
          </p>
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
              {filtered.map((payment) => {
                const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={payment.id} className="hover:bg-primary/5 transition-colors">
                    <td className="font-body text-sm text-muted-foreground px-4 py-3 whitespace-nowrap">
                      {new Date(payment.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="font-body text-sm text-foreground px-4 py-3">
                      {payment.description || <span className="text-muted-foreground italic">—</span>}
                    </td>
                    <td className="font-heading text-sm font-bold text-right px-4 py-3 whitespace-nowrap">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium mx-auto ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-background rounded-2xl shadow-elevated w-full max-w-md">
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
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input-field w-full"
                  placeholder="1.500,00"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  required
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
                  <option value="success">Ödendi</option>
                  <option value="pending">Bekliyor</option>
                  <option value="failed">İptal</option>
                </select>
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Açıklama
                </label>
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
                      Kaydediliyor...
                    </span>
                  ) : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
