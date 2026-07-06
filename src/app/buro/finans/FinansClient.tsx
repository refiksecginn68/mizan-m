"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import {
  Plus, X, TrendingUp, TrendingDown, Download, CheckCircle, Clock, XCircle,
  RotateCcw, BarChart2, ChevronDown, ChevronRight, Layers, User, FolderOpen,
  Wallet, ArrowDownCircle, ArrowUpCircle, Loader2,
} from "lucide-react";

interface PaymentMetadata {
  due_date?: string;
  direction?: "gelir" | "gider";
  client_id?: string;
  client_name?: string;
  case_id?: string;
  case_title?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  provider: string;
  description: string | null;
  created_at: string;
  user_id: string;
  metadata?: PaymentMetadata | null;
}

interface ClientOption { id: string; full_name: string }
interface CaseOption { id: string; title: string; case_number?: string | null; client_id?: string | null }

interface FinansClientProps {
  initialPayments: Payment[];
  clients: ClientOption[];
  cases: CaseOption[];
  preselect?: { clientId?: string; clientName?: string; caseId?: string; caseTitle?: string };
}

// Üç kayıt modu: müvekkil ödemesi (gelir), serbest gelir, gider
type KayitTur = "muvekkil" | "serbest" | "gider";

interface FormData {
  kayitTur: KayitTur;
  amount: string;
  currency: string;
  status: string;
  description: string;
  clientId: string;
  caseId: string;
  taksitli: boolean;
  taksit_sayisi: number;
  taksit_aralik: "haftalik" | "aylik";
}

const EMPTY_FORM: FormData = {
  kayitTur: "muvekkil",
  amount: "",
  currency: "TRY",
  status: "success",
  description: "",
  clientId: "",
  caseId: "",
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

function direction(p: Payment): "gelir" | "gider" {
  return p.metadata?.direction === "gider" ? "gider" : "gelir";
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
  meta: PaymentMetadata | null;
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
          currency: p.currency, latestDate: p.created_at, meta: p.metadata ?? null,
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
        totalCount: 1, currency: p.currency, latestDate: p.created_at, meta: p.metadata ?? null,
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

// Müvekkil/dosya rozeti
function MetaChip({ meta }: { meta: PaymentMetadata | null }) {
  if (!meta?.client_name && !meta?.case_title) return null;
  return (
    <span className="inline-flex items-center gap-2 ml-2">
      {meta.client_name && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full">
          <User className="w-2.5 h-2.5" />{meta.client_name}
        </span>
      )}
      {meta.case_title && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
          <FolderOpen className="w-2.5 h-2.5" />{meta.case_title}
        </span>
      )}
    </span>
  );
}

export default function FinansClient({ initialPayments, clients, cases, preselect }: FinansClientProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [statusFilter, setStatusFilter] = useState("tumu");
  const [yonFilter, setYonFilter] = useState<"tumu" | "gelir" | "gider">("tumu");
  const [markingPaid, setMarkingPaid] = useState("");

  // Çapraz geçiş: /buro/finans?client=ID&clientName=... → modal otomatik açılır, müvekkil seçili
  useEffect(() => {
    if (preselect?.clientId || preselect?.caseId) {
      setFormData({
        ...EMPTY_FORM,
        kayitTur: "muvekkil",
        clientId: preselect.clientId ?? "",
        caseId: preselect.caseId ?? "",
      });
      setShowModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = payments.filter((p) => {
    if (statusFilter !== "tumu" && p.status !== statusFilter) return false;
    if (yonFilter !== "tumu" && direction(p) !== yonFilter) return false;
    return true;
  });

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

  // ── Gelir-gider analizi ──
  const totalGelir = payments.filter((p) => p.status === "success" && direction(p) === "gelir").reduce((s, p) => s + p.amount, 0);
  const totalGider = payments.filter((p) => p.status === "success" && direction(p) === "gider").reduce((s, p) => s + p.amount, 0);
  const bakiye = totalGelir - totalGider;
  const totalPending = payments.filter((p) => p.status === "pending" && direction(p) === "gelir").reduce((s, p) => s + p.amount, 0);

  const now = new Date();
  const thisMonthKey = getMonthKey(now.toISOString());
  const lastMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString());

  const thisMonth = payments.filter((p) => getMonthKey(p.created_at) === thisMonthKey && p.status === "success" && direction(p) === "gelir").reduce((s, p) => s + p.amount, 0);
  const lastMonth = payments.filter((p) => getMonthKey(p.created_at) === lastMonthKey && p.status === "success" && direction(p) === "gelir").reduce((s, p) => s + p.amount, 0);
  const monthChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  // 6 aylık gelir-gider grafiği
  const chartData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(getMonthKey(d.toISOString()));
    }
    return months.map((key) => ({
      key,
      label: getMonthLabel(key),
      gelir: payments.filter((p) => getMonthKey(p.created_at) === key && p.status === "success" && direction(p) === "gelir").reduce((s, p) => s + p.amount, 0),
      gider: payments.filter((p) => getMonthKey(p.created_at) === key && p.status === "success" && direction(p) === "gider").reduce((s, p) => s + p.amount, 0),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments]);

  const maxChartVal = Math.max(...chartData.map((d) => Math.max(d.gelir, d.gider)), 1);

  // Seçili müvekkile ait dosyalar (dosya dropdown daraltma)
  const clientCases = formData.clientId
    ? cases.filter((c) => !c.client_id || c.client_id === formData.clientId)
    : cases;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) { setFormError("Geçerli bir tutar giriniz."); return; }
    if (formData.kayitTur === "muvekkil" && !formData.clientId) {
      setFormError("Müvekkil seçiniz veya 'Serbest Gelir' modunu kullanınız.");
      return;
    }
    if (formData.kayitTur !== "muvekkil" && !formData.description.trim()) {
      setFormError(formData.kayitTur === "gider" ? "Gider adı giriniz." : "Ödeme adı giriniz.");
      return;
    }

    const client = clients.find((c) => c.id === formData.clientId);
    const kase = cases.find((c) => c.id === formData.caseId);
    const common = {
      currency: formData.currency,
      direction: formData.kayitTur === "gider" ? "gider" : "gelir",
      client_id: formData.kayitTur === "muvekkil" ? formData.clientId || undefined : undefined,
      client_name: formData.kayitTur === "muvekkil" ? client?.full_name : undefined,
      case_id: formData.kayitTur === "muvekkil" ? formData.caseId || undefined : undefined,
      case_title: formData.kayitTur === "muvekkil" ? (kase ? kase.case_number || kase.title : undefined) : undefined,
    };
    const baseDesc =
      formData.kayitTur === "muvekkil"
        ? (formData.description.trim() || `${client?.full_name ?? "Müvekkil"} ödemesi`)
        : formData.description.trim();

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
              ...common,
              amount: Math.round(taksitTutar * 100) / 100,
              status: i === 0 ? formData.status : "pending",
              description: `${baseDesc || "Taksit"} (${i + 1}/${formData.taksit_sayisi})`,
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
          body: JSON.stringify({ ...common, amount: amt, status: formData.status, description: baseDesc }),
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

  // Taksit / bekleyen ödemeyi "Ödendi" işaretle
  async function markPaid(id: string) {
    setMarkingPaid(id);
    try {
      const res = await fetch("/api/buro/finans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "success" }),
      });
      const data = await res.json() as { payment?: Payment };
      if (res.ok && data.payment) {
        setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "success" } : p)));
      }
    } catch { /* ignore */ }
    setMarkingPaid("");
  }

  const handleExport = () => {
    const rows = [
      ["Tarih", "Açıklama", "Müvekkil", "Dosya", "Yön", "Tutar", "Para Birimi", "Durum"],
      ...filtered.map((p) => [
        new Date(p.created_at).toLocaleDateString("tr-TR"),
        p.description || "",
        p.metadata?.client_name || "",
        p.metadata?.case_title || "",
        direction(p) === "gider" ? "Gider" : "Gelir",
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
      {/* Gelir-gider özet kartları */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <div className="card bg-green-50">
          <p className="font-body text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <ArrowUpCircle className="w-3.5 h-3.5 text-green-600" /> Toplam Gelir
          </p>
          <p className="font-heading text-2xl font-bold text-green-700">{formatCurrency(totalGelir)}</p>
          {lastMonth > 0 && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold mt-1 ${monthChange >= 0 ? "text-green-600" : "text-red-500"}`}>
              {monthChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              Bu ay {formatCurrency(thisMonth)} ({monthChange >= 0 ? "+" : ""}{monthChange.toFixed(0)}%)
            </span>
          )}
        </div>
        <div className="card bg-red-50">
          <p className="font-body text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" /> Toplam Gider
          </p>
          <p className="font-heading text-2xl font-bold text-red-600">{formatCurrency(totalGider)}</p>
        </div>
        <div className={`card ${bakiye >= 0 ? "bg-primary/5" : "bg-red-50"}`}>
          <p className="font-body text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-primary" /> Bakiye (Net)
          </p>
          <p className={`font-heading text-2xl font-bold ${bakiye >= 0 ? "text-primary" : "text-red-600"}`}>{formatCurrency(bakiye)}</p>
        </div>
        <div className="card bg-yellow-50">
          <p className="font-body text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-yellow-600" /> Bekleyen Tahsilat
          </p>
          <p className="font-heading text-2xl font-bold text-yellow-700">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* 6 aylık gelir-gider grafiği */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-primary" />
          <p className="font-heading text-sm font-bold text-primary">Son 6 Ay — Gelir / Gider</p>
          <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/70 inline-block" />Gelir</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Gider</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {chartData.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex justify-center items-end gap-0.5" style={{ height: "88px" }}>
                <div
                  className={`w-1/2 rounded-t-sm transition-all ${d.key === thisMonthKey ? "bg-green-600" : "bg-green-500/60"}`}
                  style={{ height: `${d.gelir > 0 ? Math.max(4, (d.gelir / maxChartVal) * 80) : 2}px` }}
                  title={`Gelir: ${formatCurrency(d.gelir)}`}
                />
                <div
                  className="w-1/2 bg-red-400 rounded-t-sm"
                  style={{ height: `${d.gider > 0 ? Math.max(4, (d.gider / maxChartVal) * 80) : 2}px` }}
                  title={`Gider: ${formatCurrency(d.gider)}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {(["tumu", "gelir", "gider"] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYonFilter(y)}
              className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${
                yonFilter === y
                  ? "bg-primary text-white"
                  : "bg-white text-muted-foreground border border-border hover:border-primary"
              }`}
            >
              {y === "tumu" ? "Gelir + Gider" : y === "gelir" ? "Gelir" : "Gider"}
            </button>
          ))}
          <span className="w-px bg-border mx-1" />
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
            <Plus className="w-4 h-4" /> Yeni Kayıt
          </button>
        </div>
      </div>

      {/* Payments list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-lg font-bold text-primary">Kayıt bulunamadı</p>
          <p className="font-body text-sm text-muted-foreground mt-1">Yeni kayıt eklemek için butona tıklayın.</p>
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
                const isGider = group.meta?.direction === "gider";
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
                        {isGider && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full mr-2">GİDER</span>}
                        {payment.description || <span className="text-muted-foreground italic">—</span>}
                        <MetaChip meta={payment.metadata ?? null} />
                      </td>
                      <td className={`font-heading text-sm font-bold text-right px-4 py-3 whitespace-nowrap ${isGider ? "text-red-600" : ""}`}>
                        {isGider ? "−" : ""}{formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                          {payment.status === "pending" && (
                            <button
                              onClick={() => markPaid(payment.id)}
                              disabled={markingPaid === payment.id}
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                            >
                              {markingPaid === payment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ödendi ✓"}
                            </button>
                          )}
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
                          {isGider && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">GİDER</span>}
                          {group.description || <span className="text-muted-foreground italic">Taksitli Ödeme</span>}
                          <MetaChip meta={group.meta} />
                        </span>
                      </td>
                      <td className={`font-heading text-sm font-bold text-right px-4 py-3 whitespace-nowrap ${isGider ? "text-red-600" : ""}`}>
                        {isGider ? "−" : ""}{formatCurrency(group.totalAmount, group.currency)}
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
                      const due = payment.metadata?.due_date;
                      return (
                        <tr key={payment.id} className="bg-primary/[0.03]">
                          <td className="font-body text-xs text-muted-foreground px-4 py-2 whitespace-nowrap pl-8">
                            {due ? `Vade: ${new Date(due).toLocaleDateString("tr-TR")}` : new Date(payment.created_at).toLocaleDateString("tr-TR")}
                          </td>
                          <td className="font-body text-xs text-muted-foreground px-4 py-2 pl-10">
                            {payment.description}
                          </td>
                          <td className="font-body text-xs font-semibold text-right px-4 py-2 whitespace-nowrap text-muted-foreground">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${statusCfg.color}`}>
                                <StatusIcon className="w-2.5 h-2.5" />
                                {statusCfg.label}
                              </span>
                              {payment.status === "pending" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markPaid(payment.id); }}
                                  disabled={markingPaid === payment.id}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                                >
                                  {markingPaid === payment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ödendi ✓"}
                                </button>
                              )}
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
          <div className="bg-background rounded-2xl shadow-elevated w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-primary">Yeni Kayıt</h2>
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

              {/* Kayıt türü: müvekkil ödemesi / serbest gelir / gider */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "muvekkil", label: "Müvekkil Ödemesi", icon: User },
                  { v: "serbest", label: "Serbest Gelir", icon: ArrowUpCircle },
                  { v: "gider", label: "Gider", icon: ArrowDownCircle },
                ] as const).map(({ v, label, icon: Icon }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, kayitTur: v }))}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                      formData.kayitTur === v
                        ? v === "gider" ? "border-red-300 bg-red-50 text-red-700" : "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Müvekkil + dosya seçimi */}
              {formData.kayitTur === "muvekkil" && (
                <>
                  <div>
                    <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                      Müvekkil <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input-field w-full"
                      value={formData.clientId}
                      onChange={(e) => setFormData((p) => ({ ...p, clientId: e.target.value, caseId: "" }))}
                    >
                      <option value="">Müvekkil seçin...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Dosya (opsiyonel)</label>
                    <select
                      className="input-field w-full"
                      value={formData.caseId}
                      onChange={(e) => setFormData((p) => ({ ...p, caseId: e.target.value }))}
                    >
                      <option value="">Dosya ile ilişkilendirme yok</option>
                      {clientCases.map((c) => (
                        <option key={c.id} value={c.id}>{c.case_number ? `${c.case_number} — ` : ""}{c.title}</option>
                      ))}
                    </select>
                  </div>
                </>
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
                  <p className="font-body text-sm font-medium text-foreground">Taksitli</p>
                  {formData.taksitli && formData.amount && (
                    <p className="font-body text-xs text-muted-foreground">
                      Her taksit: {formatCurrency(parseFloat(formData.amount || "0") / formData.taksit_sayisi)} — vade tarihleri otomatik dizilir
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
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  {formData.kayitTur === "gider" ? "Gider Adı" : formData.kayitTur === "serbest" ? "Ödeme Adı" : "Açıklama"}
                  {formData.kayitTur !== "muvekkil" && <span className="text-red-500"> *</span>}
                </label>
                <textarea
                  className="input-field w-full resize-none"
                  placeholder={
                    formData.kayitTur === "gider"
                      ? "Büro kirası, harç, bilirkişi ücreti vb..."
                      : formData.kayitTur === "serbest"
                        ? "Danışmanlık ücreti, arabuluculuk vb..."
                        : "Vekalet ücreti, duruşma masrafı vb... (boş bırakılırsa müvekkil adı kullanılır)"
                  }
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
