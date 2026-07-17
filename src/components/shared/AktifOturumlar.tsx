"use client";

// Profil: Aktif Oturumlar listesi — cihaz, IP, giriş/son görülme zamanı ve
// "oturumu sonlandır". Sonlandırılan cihaz ilk kalp atışında çıkış yapar.

import { useEffect, useState, useCallback } from "react";
import { MonitorSmartphone, Loader2, LogOut, ShieldCheck } from "lucide-react";

interface Cihaz {
  id: string;
  userAgent: string | null;
  ip: string | null;
  girisTarihi: string;
  sonGorulme: string;
  buCihaz: boolean;
}

function cihazAdi(ua: string | null): string {
  if (!ua) return "Bilinmeyen cihaz";
  const os =
    /Windows/i.test(ua) ? "Windows" :
    /Android/i.test(ua) ? "Android" :
    /iPhone|iPad/i.test(ua) ? "iOS" :
    /Mac OS/i.test(ua) ? "macOS" :
    /Linux/i.test(ua) ? "Linux" : "Cihaz";
  const tarayici =
    /Edg\//i.test(ua) ? "Edge" :
    /OPR\//i.test(ua) ? "Opera" :
    /Chrome\//i.test(ua) ? "Chrome" :
    /Firefox\//i.test(ua) ? "Firefox" :
    /Safari\//i.test(ua) ? "Safari" : "Tarayıcı";
  return `${os} · ${tarayici}`;
}

function zaman(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function AktifOturumlar() {
  const [cihazlar, setCihazlar] = useState<Cihaz[]>([]);
  const [loading, setLoading] = useState(true);
  const [sonlandirilan, setSonlandirilan] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    try {
      const res = await fetch("/api/oturum");
      if (res.ok) {
        const data = (await res.json()) as { cihazlar?: Cihaz[] };
        setCihazlar(data.cihazlar ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  async function sonlandir(id: string) {
    setSonlandirilan(id);
    try {
      const res = await fetch("/api/oturum", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setCihazlar((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
    setSonlandirilan(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-[#c9a84c]" />
        <h2 className="font-heading text-base font-bold text-[#0f1729]">Aktif Oturumlar</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Hesabınızın açık olduğu cihazlar. Yeni bir cihazdan giriş yapıldığında en eski oturum otomatik kapatılır.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
        </div>
      ) : cihazlar.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">Kayıtlı aktif oturum bulunamadı.</p>
      ) : (
        <div className="space-y-2">
          {cihazlar.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
              <MonitorSmartphone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0f1729] truncate">
                  {cihazAdi(c.userAgent)}
                  {c.buCihaz && (
                    <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Bu cihaz</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400">
                  {c.ip ? `IP: ${c.ip} · ` : ""}Giriş: {zaman(c.girisTarihi)} · Son görülme: {zaman(c.sonGorulme)}
                </p>
              </div>
              <button
                onClick={() => sonlandir(c.id)}
                disabled={sonlandirilan === c.id}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {sonlandirilan === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                Sonlandır
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
