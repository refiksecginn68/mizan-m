"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

interface Odeme {
  id: string;
  kullanici_id: string;
  ad_soyad: string;
  email: string;
  paket_kodu: string;
  tutar_try: number;
  referans_kodu: string;
  dekont_no: string | null;
  aciklama: string | null;
  durum: "pending" | "approved" | "rejected";
  olusturma_tarihi: string;
  onay_tarihi: string | null;
}

const SEKMELER = [
  { id: "pending", label: "Bekleyen" },
  { id: "approved", label: "Onaylanan" },
  { id: "rejected", label: "Reddedilen" },
] as const;

export default function OdemelerClient({ odemeler }: { odemeler: Odeme[] }) {
  const router = useRouter();
  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]["id"]>("pending");
  const [islemId, setIslemId] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const filtered = odemeler.filter((o) => o.durum === sekme);

  async function onayla(id: string) {
    setIslemId(id);
    setHata(null);
    const res = await fetch("/api/admin/odeme/onayla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setIslemId(null);
    if (!res.ok) {
      setHata(data.error ?? "Onay başarısız");
      return;
    }
    router.refresh();
  }

  async function reddet(id: string) {
    const sebep = window.prompt("Red sebebi (kullanıcıya bilgi olarak iletilmez, sadece kayıt için):", "Ödeme hesaba ulaşmadı");
    if (sebep === null) return;
    setIslemId(id);
    setHata(null);
    const res = await fetch("/api/admin/odeme/reddet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, sebep }),
    });
    const data = await res.json();
    setIslemId(null);
    if (!res.ok) {
      setHata(data.error ?? "Red işlemi başarısız");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Ödemeler</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Aynı talep iki kez onaylanamaz — onay/red, talebin durumu &quot;bekliyor&quot; olduğu sürece
          tek seferlik ve atomik olarak işlenir.
        </p>
      </div>

      <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1 w-fit">
        {SEKMELER.map((s) => (
          <button key={s.id} onClick={() => setSekme(s.id)}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              sekme === s.id ? "bg-[#0f1729] text-white" : "text-gray-500 hover:text-primary"
            }`}>
            {s.label} ({odemeler.filter((o) => o.durum === s.id).length})
          </button>
        ))}
      </div>

      {hata && <p className="font-body text-sm text-red-600">{hata}</p>}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Kullanıcı</th>
                <th className="px-4 py-3 font-semibold">Paket</th>
                <th className="px-4 py-3 font-semibold">Tutar</th>
                <th className="px-4 py-3 font-semibold">Referans</th>
                <th className="px-4 py-3 font-semibold">Dekont No</th>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                {sekme === "pending" && <th className="px-4 py-3 font-semibold">İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary">{o.ad_soyad}</p>
                    <p className="text-xs text-muted-foreground">{o.email}</p>
                  </td>
                  <td className="px-4 py-3">{o.paket_kodu}</td>
                  <td className="px-4 py-3 font-semibold">₺{Number(o.tutar_try).toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-accent">{o.referans_kodu}</td>
                  <td className="px-4 py-3 text-xs">{o.dekont_no ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(o.olusturma_tarihi).toLocaleString("tr-TR")}
                  </td>
                  {sekme === "pending" && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onayla(o.id)} disabled={islemId === o.id}
                          className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          {islemId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Onayla
                        </button>
                        <button onClick={() => reddet(o.id)} disabled={islemId === o.id}
                          className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          <X className="w-3.5 h-3.5" /> Reddet
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Bu durumda ödeme yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
