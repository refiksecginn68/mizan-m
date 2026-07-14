"use client";

import { useState } from "react";
import { Check, Copy, Landmark, Star, BellOff, CheckCircle2, CreditCard } from "lucide-react";

interface Paket {
  code: string;
  name: string;
  price_try: number;
  query_quota: number;
  is_popular: boolean;
  features: string[];
}

interface TalepSonuc {
  referenceCode: string;
  amountTry: number;
  packageName: string;
  queryQuota: number;
  iban: string;
  hesapAdi: string;
  existing?: boolean;
}

interface Props {
  paketler: Paket[];
  kalanKota: number;
  hatirlatmaAktif: boolean;
}

export default function KrediYukleClient({ paketler, kalanKota, hatirlatmaAktif }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [talep, setTalep] = useState<TalepSonuc | null>(null);
  // Bildirim akışı: havale bilgileri → dekont formu → teşekkür
  const [adim, setAdim] = useState<"havale" | "form" | "tamam">("havale");
  const [dekontNo, setDekontNo] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [bildirimHata, setBildirimHata] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState<string | null>(null);
  const [hatirlatma, setHatirlatma] = useState(hatirlatmaAktif);

  const aylikPaketler = paketler.filter((p) => !p.code.startsWith("kontor_"));
  const kontorPaketler = paketler.filter((p) => p.code.startsWith("kontor_"));

  async function paketSec(code: string) {
    setLoading(code);
    setHata(null);
    try {
      const res = await fetch("/api/odeme/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHata(data.error ?? "Talep oluşturulamadı.");
        return;
      }
      setTalep(data);
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(null);
    }
  }

  function kopyala(metin: string, alan: string) {
    navigator.clipboard.writeText(metin).then(() => {
      setKopyalandi(alan);
      setTimeout(() => setKopyalandi(null), 2000);
    });
  }

  async function hatirlatmayiKapat() {
    const res = await fetch("/api/odeme/hatirlatma-iptal", { method: "POST" });
    if (res.ok) setHatirlatma(false);
  }

  async function bildirimGonder() {
    if (!talep || !dekontNo.trim()) {
      setBildirimHata("Dekont / işlem numarası zorunludur.");
      return;
    }
    setGonderiliyor(true);
    setBildirimHata(null);
    try {
      const res = await fetch("/api/odeme/bildirim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceCode: talep.referenceCode,
          receiptNo: dekontNo.trim(),
          note: aciklama.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBildirimHata(data.error ?? "Bildirim gönderilemedi.");
        return;
      }
      setAdim("tamam");
    } catch {
      setBildirimHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setGonderiliyor(false);
    }
  }

  // Havale ekranı (talep oluşturulduktan sonra)
  if (talep) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        {adim === "tamam" ? (
          <div className="bg-white rounded-2xl border border-border shadow-card p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-primary mb-2">Bildiriminiz Alındı!</h2>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Ödeme bildiriminiz yöneticimize iletildi. Havaleniz kontrol edildikten sonra
              sorgu kotanız hesabınıza tanımlanacak ve size e-posta ile bilgi verilecektir.
              Bu işlem genellikle aynı gün tamamlanır.
            </p>
            <p className="font-body text-xs text-muted-foreground mt-4">
              Referans kodunuz: <span className="font-bold text-accent">{talep.referenceCode}</span>
            </p>
          </div>
        ) : adim === "form" ? (
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 sm:p-8">
            <h2 className="font-heading text-lg font-bold text-primary mb-1">Ödeme Bildirimi</h2>
            <p className="font-body text-xs text-muted-foreground mb-5">
              {talep.packageName} · ₺{talep.amountTry.toLocaleString("tr-TR")} · Referans:{" "}
              <span className="font-bold text-accent">{talep.referenceCode}</span>
            </p>
            <label className="block font-body text-xs font-semibold text-primary mb-1.5" htmlFor="dekont-no">
              Dekont / İşlem Numarası <span className="text-danger">*</span>
            </label>
            <input
              id="dekont-no"
              type="text"
              value={dekontNo}
              onChange={(e) => setDekontNo(e.target.value)}
              placeholder="Örn: 2026071412345"
              maxLength={100}
              className="w-full border border-border rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 mb-4"
            />
            <label className="block font-body text-xs font-semibold text-primary mb-1.5" htmlFor="dekont-aciklama">
              Açıklama (isteğe bağlı)
            </label>
            <textarea
              id="dekont-aciklama"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Örn: Farklı bir isimden havale yaptım"
              maxLength={500}
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            {bildirimHata && (
              <p className="font-body text-xs text-danger mt-3">{bildirimHata}</p>
            )}
            <button
              type="button"
              onClick={bildirimGonder}
              disabled={gonderiliyor}
              className="btn-primary w-full mt-5"
            >
              {gonderiliyor ? "Gönderiliyor..." : "Ödeme Bildirimini Gönder"}
            </button>
            <button
              type="button"
              onClick={() => setAdim("havale")}
              className="w-full mt-3 font-body text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ← Havale bilgilerine geri dön
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 sm:p-8">
            {talep.existing && (
              <div className="mb-4 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
                <p className="font-body text-xs text-sky-800 leading-relaxed">
                  Bu paket için zaten bekleyen bir talebiniz var:{" "}
                  <strong>{talep.referenceCode}</strong>. Aşağıdaki bilgilerle havalenizi
                  yapabilirsiniz; yeni bir talep oluşturulmadı.
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#0f1729] flex items-center justify-center">
                <Landmark className="w-5 h-5 text-[#c9a84c]" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-primary">Havale / EFT Bilgileri</h2>
                <p className="font-body text-xs text-muted-foreground">
                  {talep.packageName} · {talep.queryQuota.toLocaleString("tr-TR")} sorgu
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { alan: "Hesap Adı", deger: talep.hesapAdi },
                { alan: "IBAN", deger: talep.iban },
                { alan: "Tutar", deger: `₺${talep.amountTry.toLocaleString("tr-TR")}` },
                { alan: "Referans Kodu", deger: talep.referenceCode },
              ].map(({ alan, deger }) => (
                <div key={alan} className="flex items-center justify-between bg-[#f8f9fa] border border-gray-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-body text-[11px] text-muted-foreground">{alan}</p>
                    <p className={`font-body text-sm font-bold ${alan === "Referans Kodu" ? "text-accent" : "text-primary"}`}>
                      {deger}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => kopyala(deger, alan)}
                    className="text-muted-foreground hover:text-accent transition-colors"
                    aria-label={`${alan} kopyala`}
                  >
                    {kopyalandi === alan ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="font-body text-xs text-amber-800 leading-relaxed">
                <strong>Önemli:</strong> Havale/EFT açıklamasına mutlaka{" "}
                <strong>{talep.referenceCode}</strong> referans kodunu yazın. Kod olmadan
                ödemenizin eşleştirilmesi gecikebilir.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAdim("form")}
              className="btn-primary w-full mt-6"
            >
              Havaleyi Yaptım — Ödeme Bildirimi Gönder
            </button>
          </div>
        )}
      </div>
    );
  }

  // Paket seçim ekranı
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-sm text-muted-foreground">
          Kalan sorgu hakkınız: <span className="font-bold text-primary">{kalanKota.toLocaleString("tr-TR")}</span>
        </p>
        {hatirlatma && (
          <button
            type="button"
            onClick={hatirlatmayiKapat}
            className="flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-danger transition-colors"
          >
            <BellOff className="w-3.5 h-3.5" />
            Aylık hatırlatmayı kapat
          </button>
        )}
      </div>

      {hata && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 mb-4">
          <p className="font-body text-sm text-danger">{hata}</p>
        </div>
      )}

      {/* Aylık paketler */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {aylikPaketler.map((p) => (
          <div
            key={p.code}
            className={`bg-white rounded-2xl border shadow-card p-6 relative ${
              p.is_popular ? "border-2 border-[#c9a84c]" : "border-border"
            }`}
          >
            {p.is_popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a84c] text-white font-body text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> En Popüler
              </span>
            )}
            <h3 className="font-heading text-lg font-bold text-primary">{p.name}</h3>
            <p className="font-heading text-3xl font-extrabold text-primary mt-2">
              ₺{p.price_try.toLocaleString("tr-TR")}
              <span className="font-body text-sm font-normal text-muted-foreground">/ay</span>
            </p>
            <p className="font-body text-sm text-accent font-semibold mt-1">
              {p.query_quota.toLocaleString("tr-TR")} sorgu / ay
            </p>
            <ul className="mt-4 space-y-2">
              {(p.features ?? []).map((f) => (
                <li key={f} className="flex items-start gap-2 font-body text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => paketSec(p.code)}
              className="btn-primary w-full mt-6"
            >
              {loading === p.code ? "Hazırlanıyor..." : "Havale ile Öde"}
            </button>
            <button
              type="button"
              disabled
              title="Kredi kartı ile ödeme yakında"
              className="w-full mt-2 flex items-center justify-center gap-1.5 font-body text-xs text-muted-foreground border border-dashed border-border rounded-lg py-2 cursor-not-allowed opacity-70"
            >
              <CreditCard className="w-3.5 h-3.5" /> Kredi Kartı — Yakında
            </button>
          </div>
        ))}
      </div>

      {/* Kontör paketleri */}
      <h2 className="font-heading text-lg font-bold text-primary mb-1">Kontör (Ek Sorgu)</h2>
      <p className="font-body text-sm text-muted-foreground mb-4">
        Aylık kotanız bitince ek sorgu yükleyin — kontörler süresiz geçerlidir.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {kontorPaketler.map((p) => (
          <div
            key={p.code}
            className={`bg-white rounded-2xl shadow-card p-6 flex items-center justify-between relative ${
              p.is_popular ? "border-2 border-[#c9a84c]" : "border border-border"
            }`}
          >
            {p.is_popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a84c] text-white font-body text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                <Star className="w-3 h-3" /> En Avantajlı
              </span>
            )}
            <div>
              <h3 className="font-heading text-base font-bold text-primary">{p.name}</h3>
              <p className="font-body text-sm text-accent font-semibold">
                +{p.query_quota.toLocaleString("tr-TR")} sorgu
              </p>
              <p className="font-heading text-xl font-extrabold text-primary mt-1">
                ₺{p.price_try.toLocaleString("tr-TR")}
                <span className="font-body text-xs font-normal text-muted-foreground ml-1.5">
                  (₺{(p.price_try / p.query_quota).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}/sorgu)
                </span>
              </p>
            </div>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => paketSec(p.code)}
              className="btn-outline px-4 py-2 text-sm"
            >
              {loading === p.code ? "..." : "Satın Al"}
            </button>
          </div>
        ))}
      </div>

      <p className="font-body text-xs text-muted-foreground mt-8 text-center">
        Ödemeler şimdilik havale/EFT ile alınmaktadır — kredi kartı desteği yakında.
      </p>
    </div>
  );
}
