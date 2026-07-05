"use client";

import { useState } from "react";
import { Puzzle, Copy, Check, Loader2, KeyRound } from "lucide-react";

// UYAP Chrome eklentisi için bağlantı kodu üretme kartı
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
    <div className="card mt-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Puzzle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold text-primary">Chrome Eklentisi Bağlantısı</h2>
          <p className="font-body text-xs text-muted-foreground">
            UYAP Avukat Portal&apos;da açık dosyalarınızı tek tıkla Mizanım&apos;a aktarın
          </p>
        </div>
      </div>
      <ol className="font-body text-xs text-muted-foreground space-y-1 mb-4 list-decimal pl-4">
        <li>Mizanım UYAP eklentisini Chrome&apos;a yükleyin (şimdilik geliştirici modunda)</li>
        <li>Aşağıdan bağlantı kodu oluşturup kopyalayın</li>
        <li>Eklenti penceresine yapıştırın — UYAP&apos;ta gördüğünüz dosyalar aktarılabilir hale gelir</li>
      </ol>
      {token ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-primary/5 border border-border rounded-lg px-3 py-2 text-xs font-mono truncate">
            {token}
          </code>
          <button onClick={copy} className="btn-outline flex items-center gap-1.5 text-sm py-2 flex-shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
      ) : (
        <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Bağlantı Kodu Oluştur
        </button>
      )}
      {error && <p className="font-body text-xs text-red-600 mt-2">{error}</p>}
      <p className="font-body text-[10px] text-muted-foreground mt-3">
        Kod 90 gün geçerlidir ve yalnızca sizin hesabınıza dosya aktarabilir. Eklenti UYAP&apos;a otomatik giriş yapmaz;
        yalnızca sizin e-imzanızla açtığınız oturumdaki sayfaları okur.
      </p>
    </div>
  );
}
