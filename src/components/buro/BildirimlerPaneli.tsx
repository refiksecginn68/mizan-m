"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, RefreshCw, Scale, AlertCircle, Info, Wallet } from "lucide-react";

interface Bildirim {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  durusma: Scale,
  sure: AlertCircle,
  kredi: Wallet,
};

// Bildirim türü → ilgili sayfa
const TYPE_HREF: Record<string, string> = {
  durusma: "/buro/takvim",
  sure: "/buro/takvim",
  kredi: "/buro/finans",
  dosya: "/buro/davalar",
};

// Ana sayfa bildirim paneli: dosya hareketleri, yaklaşan duruşmalar, vadesi
// gelen ödemeler. Okunmamışlar renkli nokta ile ayrılır, tıklayınca ilgili sayfaya gider.
export default function BildirimlerPaneli() {
  const router = useRouter();
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const res = await fetch("/api/buro/bildirimler");
      if (res.ok) {
        const d = await res.json();
        setBildirimler(d.notifications ?? []);
      }
    } catch { /* yoksay */ }
    setYukleniyor(false);
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  function tikla(b: Bildirim) {
    if (!b.is_read) {
      setBildirimler((list) => list.map((x) => (x.id === b.id ? { ...x, is_read: true } : x)));
      fetch("/api/buro/bildirimler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id }),
      }).catch(() => {});
    }
    const href = TYPE_HREF[b.type];
    if (href) router.push(href);
  }

  const okunmamis = bildirimler.filter((b) => !b.is_read).length;
  const gosterilen = bildirimler.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
        <Bell className="w-4 h-4 text-[#c9a84c]" />
        <h2 className="font-heading text-sm font-bold text-[#0f1729]">Bildirimler</h2>
        {okunmamis > 0 && (
          <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
            {okunmamis}
          </span>
        )}
        <button
          onClick={yukle}
          disabled={yukleniyor}
          title="Yenile"
          className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#c9a84c] hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${yukleniyor ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {gosterilen.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">
            {yukleniyor ? "Yükleniyor..." : "Bildirim yok"}
          </p>
        )}
        {gosterilen.map((b) => {
          const Icon = TYPE_ICON[b.type] || Info;
          return (
            <button
              key={b.id}
              onClick={() => tikla(b)}
              className={`w-full flex items-start gap-2.5 px-5 py-3 text-left hover:bg-gray-50 transition-colors ${
                b.is_read ? "" : "bg-[#c9a84c]/5"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  b.is_read ? "bg-gray-200" : "bg-[#c9a84c]"
                }`}
              />
              <Icon className="w-3.5 h-3.5 text-[#c9a84c] mt-0.5 flex-shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-gray-800 truncate">{b.title}</span>
                <span className="block text-[11px] text-gray-500 mt-0.5 line-clamp-2">{b.body}</span>
                <span className="block text-[10px] text-gray-300 mt-1">
                  {new Date(b.created_at).toLocaleString("tr-TR", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
