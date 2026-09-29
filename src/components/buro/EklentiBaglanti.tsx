"use client";

import { useState } from "react";
import { Puzzle, Copy, Check, Loader2, KeyRound, ShieldCheck, Globe, ChevronDown, Pin, LogIn, Link2 } from "lucide-react";

const STORE_URL = "https://chromewebstore.google.com/detail/ancbdklmehchmpefmjcachkidbgjapfm";

const KURULUM_ADIMLARI = [
  { ikon: Globe, metin: "Chrome Web Store'dan Mizanım eklentisini yükleyin." },
  { ikon: Pin, metin: "Eklenti simgesini araç çubuğuna sabitleyin." },
  { ikon: LogIn, metin: "UYAP Avukat Portal'a e-imzanızla normal şekilde girin." },
  { ikon: Link2, metin: "Eklentiyi açın, yukarıdaki bağlantı kodunu yapıştırın, Bağlan'a basın." },
];

// UYAP Chrome eklentisi: bağlantı kodu (üstte) + kurulum + sorun giderme
export default function EklentiBaglanti() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extension/token", { method: "POST" });
      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok || !data.token) setError(data.error ?? "Kod oluşturulamadı");
      else setToken(data.token);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
    {/* 1. Bağlantı kodu — üstte, geniş */}
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Puzzle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold text-primary">Bağlantı Kodu</h2>
          <p className="font-body text-xs text-muted-foreground">Kodu oluşturun, eklentiye yapıştırın</p>
        </div>
      </div>
      {token ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-primary/5 border border-border rounded-lg px-3 py-3 text-sm font-mono truncate">
            {token}
          </code>
          <button onClick={copy} className="btn-outline flex items-center gap-1.5 text-sm py-3 flex-shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
      ) : (
        <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Bağlantı Kodu Oluştur
        </button>
      )}
      {error && <p className="font-body text-xs text-red-600 mt-2">{error}</p>}
      {token && (
        <p className="font-body text-xs text-muted-foreground mt-3">
          Bu kodu eklentiye yapıştırın. Kod 90 gün geçerlidir, yalnızca sizin hesabınıza dosya aktarır.
        </p>
      )}
    </div>

    {/* 2. Kurulum — 4 adım, sade */}
    <div className="card mt-6">
      <h2 className="font-heading text-base font-bold text-primary mb-4">Kurulum</h2>
      <ol className="space-y-4">
        {KURULUM_ADIMLARI.map((adim, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-accent/10 text-accent font-heading font-bold text-xs flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <p className="font-body text-sm text-primary pt-0.5">{adim.metin}</p>
          </li>
        ))}
      </ol>
      <a
        href={STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full mt-5 flex items-center justify-center gap-2 text-sm no-underline"
      >
        <Globe className="w-4 h-4" />
        Mağazada Aç
      </a>
      <p className="font-body text-[11px] text-muted-foreground flex items-start gap-1.5 bg-primary/5 rounded-lg px-3 py-2 mt-4">
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
        Eklenti UYAP&apos;a otomatik giriş yapmaz, e-imza işlemi yapmaz, şifre saklamaz.
      </p>
    </div>

    {/* 3. Sorun giderme — kısa, katlanabilir */}
    <details className="card mt-6 group">
      <summary className="font-heading text-sm font-bold text-primary cursor-pointer flex items-center gap-1.5 select-none">
        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        Sorun Giderme
      </summary>
      <ul className="font-body text-xs text-muted-foreground space-y-1.5 mt-3 pl-1">
        <li>· Kod çalışmıyorsa: UYAP&apos;ta &quot;Dosya Sorgula&quot; sayfasında olduğunuzdan emin olun</li>
        <li>· Dosya görünmüyorsa: önce bir sorgu çalıştırın, liste dolsun</li>
        <li>· Hâlâ olmuyorsa: sayfayı yenileyin (F5)</li>
      </ul>
    </details>
    </>
  );
}
