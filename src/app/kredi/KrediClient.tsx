"use client";

import { useState } from "react";
import {
  CreditCard,
  CheckCircle,
  Star,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RefreshCw,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_try: number;
  is_popular: boolean;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: "spend" | "purchase" | "bonus" | "refund";
  description: string;
  created_at: string;
}

interface KrediClientProps {
  packages: CreditPackage[];
  currentBalance: number;
  transactions: CreditTransaction[];
  hasIyzicoKey: boolean;
  isAvukat?: boolean;
  totalQueries?: number;
}

const CREDIT_COSTS = [
  { label: "Basit soru", cost: "1 kredi" },
  { label: "Emsal araştırma", cost: "3 kredi" },
  { label: "Belge analizi", cost: "5 kredi" },
  { label: "Dilekçe üretimi", cost: "8 kredi" },
  { label: "Savunma / Sözleşme", cost: "10 kredi" },
  { label: "Medya analizi", cost: "7 kredi" },
];

const LAWYER_COSTS = [
  { label: "MizanAI Hukuki Sohbet", cost: "1 sorgu" },
  { label: "Belge & Evrak Analizi", cost: "1 sorgu" },
  { label: "Dilekçe Üretimi / Düzenleme", cost: "1 sorgu" },
  { label: "Delil & Medya Analizi", cost: "1 sorgu" },
  { label: "Emsal / Mevzuat Arama", cost: "Sınırsız / Ücretsiz" },
];

function transactionIcon(type: string) {
  if (type === "spend") return <ArrowUpRight className="w-4 h-4 text-red-500" />;
  if (type === "bonus") return <Gift className="w-4 h-4 text-green-600" />;
  if (type === "refund") return <RefreshCw className="w-4 h-4 text-blue-500" />;
  return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
}

function transactionColor(type: string) {
  if (type === "spend") return "text-red-600";
  return "text-green-600";
}

function transactionSign(amount: number) {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

function formatDate(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KrediClient({
  packages,
  currentBalance,
  transactions,
  hasIyzicoKey,
  isAvukat = false,
  totalQueries = 0,
}: KrediClientProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleBuyPackage(pkg: CreditPackage) {
    setErrorMsg(null);
    setLoadingId(pkg.id);
    try {
      const res = await fetch("/api/payment/iyzico/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = (await res.json()) as { checkoutFormContent?: string; token?: string; error?: string };

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Ödeme başlatılamadı, lütfen tekrar deneyin.");
        setLoadingId(null);
        return;
      }

      // iyzico checkout form HTML'ini DOM'a ekle ve submit et
      if (data.checkoutFormContent) {
        const div = document.createElement("div");
        div.innerHTML = data.checkoutFormContent;
        document.body.appendChild(div);
        const form = div.querySelector("form");
        if (form) {
          form.submit();
        } else {
          setErrorMsg("Ödeme formu yüklenemedi.");
          document.body.removeChild(div);
          setLoadingId(null);
        }
      } else {
        setErrorMsg("Ödeme formu içeriği alınamadı.");
        setLoadingId(null);
      }
    } catch {
      setErrorMsg("Bir hata oluştu, lütfen tekrar deneyin.");
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Kredi / Sorgu Bakiyesi */}
      <div className="card gradient-primary text-white p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-white/70 text-sm">
              {isAvukat ? "Kalan Yapay Zeka Sorgu Kotanız" : "Mevcut Krediniz"}
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="font-heading text-5xl font-bold text-accent">
                {currentBalance}
              </span>
              <span className="font-body text-white/80 text-lg mb-1">
                {isAvukat ? `/ ${totalQueries} sorgu` : "kredi"}
              </span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Coins className="w-8 h-8 text-accent" />
          </div>
        </div>
        {isAvukat && currentBalance < 20 && (
          <div className="mt-4 bg-white/10 border border-white/20 rounded-lg px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="font-body text-sm text-white/90">
              Sorgu kotanız azalıyor. İşlem yapmaya devam edebilmek için ek sorgu paketi satın alın.
            </p>
          </div>
        )}
        {!isAvukat && currentBalance < 5 && (
          <div className="mt-4 bg-white/10 border border-white/20 rounded-lg px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="font-body text-sm text-white/90">
              Krediniz azalıyor. İşlem yapabilmek için kredi satın alın.
            </p>
          </div>
        )}
      </div>

      {/* iyzico aktif değilse bilgi kutusu */}
      {!hasIyzicoKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-amber-800">
              Ödeme sistemi yakında aktif olacak
            </p>
            <p className="font-body text-xs text-amber-700 mt-0.5">
              iyzico entegrasyonu henüz yapılandırılmamış. Lütfen daha sonra tekrar deneyin.
            </p>
          </div>
        </div>
      )}

      {/* Hata mesajı */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Kredi / Sorgu Paketleri */}
      <section>
        <h2 className="font-heading text-xl font-bold text-primary mb-4">
          {isAvukat ? "Ek Sorgu Paketi (Kontör) Satın Al" : "Kredi Satın Al"}
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`card relative flex flex-col ${
                pkg.is_popular
                  ? "border-2 border-accent shadow-elevated"
                  : "border border-border"
              }`}
            >
              {pkg.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-accent text-white font-body text-xs font-bold px-3 py-1 rounded-full shadow">
                    <Star className="w-3 h-3 fill-white" />
                    Popüler
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-heading text-lg font-bold text-primary mt-2">
                  {pkg.name}
                </h3>
                <div className="flex items-end gap-1 mt-2">
                  <span className="font-heading text-3xl font-bold text-accent">
                    {pkg.credits}
                  </span>
                  <span className="font-body text-muted-foreground text-sm mb-1">
                    {isAvukat ? "sorgu" : "kredi"}
                  </span>
                </div>
                <p className="font-heading text-2xl font-bold text-primary mt-1">
                  {pkg.price_try.toLocaleString("tr-TR")} ₺
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  ≈ {(pkg.price_try / pkg.credits).toFixed(2)} ₺ / {isAvukat ? "sorgu" : "kredi"}
                </p>
              </div>
              <button
                onClick={() => handleBuyPackage(pkg)}
                disabled={!!loadingId || !hasIyzicoKey}
                className={`mt-4 w-full flex items-center justify-center gap-2 ${
                  pkg.is_popular ? "btn-accent" : "btn-primary"
                } py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingId === pkg.id ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Yönlendiriliyor...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Satın Al
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Kredi / Sorgu Harcama Tablosu */}
      <section>
        <h2 className="font-heading text-xl font-bold text-primary mb-4">
          {isAvukat ? "Sorgu Harcama Rehberi" : "Kredi Harcama Rehberi"}
        </h2>
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-border">
            {(isAvukat ? LAWYER_COSTS : CREDIT_COSTS).map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-3"
              >
                <span className="font-body text-sm text-foreground">{item.label}</span>
                <span className="legal-citation text-xs">{item.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İşlem Geçmişi */}
      <section>
        <h2 className="font-heading text-xl font-bold text-primary mb-4">
          İşlem Geçmişi
        </h2>
        {transactions.length === 0 ? (
          <div className="card text-center py-10">
            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-muted-foreground text-sm">
              Henüz işlem bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {transactionIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm text-foreground truncate">
                        {tx.description}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-body text-sm font-bold flex-shrink-0 ml-3 ${transactionColor(tx.type)}`}
                  >
                    {transactionSign(tx.amount)} {isAvukat ? "sorgu" : "kredi"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Yasal Uyarı */}
      <div className="bg-muted rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-muted-foreground">
            Ödemeler iyzico altyapısıyla güvenli şekilde işlenir. Satın alınan
            paketler iade edilemez. Teknik sorunlar için{" "}
            <a
              href="mailto:destek@mizanim.com"
              className="underline hover:text-primary transition-colors"
            >
              destek@mizanim.com
            </a>{" "}
            adresine yazabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
