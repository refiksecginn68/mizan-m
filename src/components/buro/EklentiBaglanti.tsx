"use client";

import { useState } from "react";
import { Puzzle, Copy, Check, Loader2, KeyRound, Download, ShieldCheck, Globe, ChevronDown } from "lucide-react";
import { EXTENSION_VERSION } from "@/lib/extension-version";

const STORE_URL = "https://chromewebstore.google.com/detail/ancbdklmehchmpefmjcachkidbgjapfm";

// UYAP Chrome eklentisi: indirme + kurulum + bağlantı kodu kartları
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
    {/* Kart 1: İndirme + kurulum */}
    <div className="card mt-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold text-primary">Mizanım UYAP Eklentisi (v{EXTENSION_VERSION})</h2>
          <p className="font-body text-xs text-muted-foreground">
            UYAP&apos;ta gördüğünüz dosyaları tek tıkla Mizanım&apos;daki davalarınıza aktarın
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <a
          href={STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex items-center gap-2 text-sm no-underline"
        >
          <Globe className="w-4 h-4" />
          Chrome&apos;a Ekle
        </a>
        <span className="font-body text-xs text-muted-foreground">
          Chrome Web Store&apos;da yayında — tek tıkla kurulur
        </span>
      </div>

      <h3 className="font-heading text-sm font-bold text-primary mb-2">Kurulum ve Kullanım</h3>
      <ol className="font-body text-xs text-muted-foreground space-y-1.5 mb-4 list-decimal pl-4">
        <li><strong>Chrome&apos;a Ekle</strong>&apos;ye tıklayın, mağazadan eklentiyi kurun</li>
        <li>Aşağıdaki karttan <strong>Bağlantı Kodu Oluşturun</strong>, eklentiye yapıştırıp <strong>Bağlan</strong> deyin</li>
        <li>UYAP Avukat Portal&apos;a <strong>kendi e-imzanızla</strong> girin, dosya sorgulama listenizi açın</li>
        <li>Eklentide <strong>Sayfayı Tara</strong> → <strong>Mizanım&apos;a Aktar</strong> — dosyalar Davalar sayfanıza işlenir (aynı esas no varsa güncellenir)</li>
      </ol>

      <details className="mb-4 group">
        <summary className="font-body text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5 select-none">
          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
          Gelişmiş / manuel kurulum (zip ile)
        </summary>
        <div className="mt-3 pl-5">
          {/* Auth korumalı indirme — sadece giriş yapmış avukatlar */}
          <a href="/api/extension/download" className="btn-outline inline-flex items-center gap-2 text-xs no-underline mb-3">
            <Download className="w-3.5 h-3.5" />
            Eklentiyi İndir (.zip)
          </a>
          <ol className="font-body text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
            <li>İndirdiğiniz zip dosyasını bir klasöre çıkarın (sağ tık → Tümünü Ayıkla)</li>
            <li>Chrome&apos;da adres çubuğuna <code className="bg-primary/5 px-1 rounded">chrome://extensions</code> yazıp Enter&apos;a basın</li>
            <li>Sağ üstteki <strong>Geliştirici modu</strong> anahtarını açın</li>
            <li><strong>Paketlenmemiş öğe yükle</strong> düğmesine tıklayıp çıkardığınız klasörü seçin</li>
          </ol>
        </div>
      </details>

      <p className="font-body text-[11px] text-muted-foreground flex items-start gap-1.5 bg-primary/5 rounded-lg px-3 py-2">
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
        <span>
          <strong>Güven notu:</strong> Eklenti UYAP&apos;a otomatik giriş yapmaz, e-imza işlemi yapmaz, şifre saklamaz.
          Yalnızca sizin açtığınız oturumda ekranda görünen dosya bilgilerini, siz istediğinizde okur.
        </span>
      </p>
    </div>

    {/* Kart 2: Bağlantı kodu */}
    <div className="card mt-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Puzzle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold text-primary">Eklenti Bağlantı Kodu</h2>
          <p className="font-body text-xs text-muted-foreground">
            Eklentiyi hesabınızla eşleştirmek için kod oluşturun
          </p>
        </div>
      </div>
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
    </>
  );
}
