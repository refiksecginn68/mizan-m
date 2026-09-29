"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Loader2 } from "lucide-react";

interface Uye {
  id: string;
  ad_soyad: string;
  email: string;
  paket_kodu: string | null;
  kredi_limiti: number;
  kalan_kullanim: number;
  kullanim_orani: number;
  kayit_tarihi: string;
  uye_ay_sayisi: number;
  son_giris: string | null;
  durum: "aktif" | "deneme" | "suresi_dolmus" | "paketsiz";
}

const DURUM_ETIKET: Record<Uye["durum"], { label: string; className: string }> = {
  aktif: { label: "Aktif", className: "bg-green-100 text-green-700" },
  deneme: { label: "Deneme", className: "bg-sky-100 text-sky-700" },
  suresi_dolmus: { label: "Süresi Dolmuş", className: "bg-red-100 text-red-700" },
  paketsiz: { label: "Paketsiz", className: "bg-gray-100 text-gray-500" },
};

export default function UyelerClient({ uyeler: uyelerProp }: { uyeler: Uye[] }) {
  const router = useRouter();
  const [uyeler, setUyeler] = useState(uyelerProp);
  const [q, setQ] = useState("");
  const [durumFiltre, setDurumFiltre] = useState<string>("tumu");
  const [silinen, setSilinen] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  async function hesabiSil(id: string, adSoyad: string) {
    if (!window.confirm(`${adSoyad} hesabını kalıcı olarak silmek istediğinize eminsiniz? Bu işlem geri alınamaz.`)) return;
    setSilinen(id);
    setHata(null);
    const res = await fetch("/api/admin/uye/sil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    const data = await res.json();
    setSilinen(null);
    if (!res.ok) {
      setHata(data.error ?? "Silme başarısız");
      return;
    }
    setUyeler((prev) => prev.filter((u) => u.id !== id));
    router.refresh();
  }

  const filtered = useMemo(() => {
    return uyeler.filter((u) => {
      if (durumFiltre !== "tumu" && u.durum !== durumFiltre) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return u.ad_soyad?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
    });
  }, [uyeler, q, durumFiltre]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Üyeler</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Sadece sayısal/hesap bilgileri gösterilir — dosya, evrak, sohbet veya arama içeriği yoktur.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad veya e-posta ara..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <select
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2 text-sm"
        >
          <option value="tumu">Tüm durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="deneme">Deneme</option>
          <option value="suresi_dolmus">Süresi Dolmuş</option>
          <option value="paketsiz">Paketsiz</option>
        </select>
        <span className="font-body text-xs text-muted-foreground">{filtered.length} üye</span>
      </div>

      {hata && <p className="font-body text-sm text-red-600">{hata}</p>}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                <th className="px-4 py-3 font-semibold">E-posta</th>
                <th className="px-4 py-3 font-semibold">Paket</th>
                <th className="px-4 py-3 font-semibold">Kalan</th>
                <th className="px-4 py-3 font-semibold">Kullanım</th>
                <th className="px-4 py-3 font-semibold">Üyelik</th>
                <th className="px-4 py-3 font-semibold">Son Giriş</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border/60 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-semibold text-primary">{u.ad_soyad}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">{u.paket_kodu ?? "—"}</td>
                  <td className="px-4 py-3">{u.kalan_kullanim.toLocaleString("tr-TR")} / {u.kredi_limiti.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3">%{u.kullanim_orani}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.kayit_tarihi).toLocaleDateString("tr-TR")} · {u.uye_ay_sayisi} ay
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.son_giris ? new Date(u.son_giris).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DURUM_ETIKET[u.durum].className}`}>
                      {DURUM_ETIKET[u.durum].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => hesabiSil(u.id, u.ad_soyad)}
                      disabled={silinen === u.id}
                      title="Hesabı kalıcı sil"
                      className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {silinen === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Sil
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">Sonuç bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
