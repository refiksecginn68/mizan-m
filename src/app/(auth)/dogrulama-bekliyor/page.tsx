"use client";

import { useState } from "react";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DogrulamaBekliyorPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (!email.trim()) {
      setError("E-posta adresinizi girin.");
      return;
    }
    setLoading(true);
    setError(null);
    // Supabase'in yerleşik SMTP'si yerine Resend'li kendi endpoint'imiz
    // (yerleşik SMTP saatte 2 e-posta ile sınırlı)
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        setError("E-posta gönderilemedi. Lütfen tekrar deneyin.");
      } else {
        setResent(true);
      }
    } catch {
      setError("E-posta gönderilemedi. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-10 h-10 text-accent" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary mb-2">
          E-postanızı Doğrulayın
        </h1>
        <p className="font-body text-muted-foreground leading-relaxed">
          Kayıt olduğunuz e-posta adresine bir doğrulama bağlantısı gönderdik.
          Devam etmek için e-postanızdaki bağlantıya tıklayın.
        </p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-foreground">Spam klasörünü kontrol edin</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              E-posta bazen gereksiz / spam klasörüne düşebilir.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-foreground">Bağlantı 24 saat geçerlidir</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Süre dolarsa aşağıdan yeni bağlantı isteyebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {resent ? (
        <div className="mt-5 bg-success/10 border border-success/30 rounded-lg px-4 py-3 text-center">
          <p className="font-body text-sm text-success font-semibold">Doğrulama e-postası tekrar gönderildi!</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="font-body text-sm text-center text-muted-foreground">E-posta gelmediyse tekrar gönderelim:</p>
          <input
            type="email"
            className="input-field"
            placeholder="E-posta adresiniz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="font-body text-xs text-danger">{error}</p>}
          <button
            onClick={resend}
            disabled={loading}
            className="w-full btn-accent flex items-center justify-center gap-2 py-2.5"
          >
            {loading ? (
              <span className="animate-pulse">Gönderiliyor...</span>
            ) : (
              <><RefreshCw className="w-4 h-4" />Tekrar Gönder</>
            )}
          </button>
        </div>
      )}

      <p className="text-center font-body text-sm text-muted-foreground mt-6">
        <Link href="/giris" className="text-accent hover:underline">
          ← Giriş sayfasına dön
        </Link>
      </p>
    </div>
  );
}
