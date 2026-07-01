"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("E-posta adresi zorunludur.");
      return;
    }
    setLoading(true);
    setError(null);

    // Önce markalı Resend emailini dene, yoksa Supabase native kullan
    const res = await fetch("/api/auth/send-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    if (!res.ok) {
      // Fallback: Supabase native
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-primary mb-2">E-posta Gönderildi</h2>
        <p className="font-body text-muted-foreground mb-2">
          <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
        </p>
        <p className="font-body text-sm text-muted-foreground mb-6">
          E-postayı göremiyorsanız spam/gereksiz klasörünü kontrol edin.
        </p>
        <Link href="/giris" className="font-body text-sm text-accent hover:underline">
          ← Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="font-heading text-2xl font-bold text-primary mb-2">Şifremi Unuttum</h1>
        <p className="font-body text-sm text-muted-foreground">
          Kayıtlı e-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-sm font-semibold text-foreground block mb-1">
            E-posta Adresi
          </label>
          <input
            type="email"
            className={`input-field ${error ? "border-danger" : ""}`}
            placeholder="ornek@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          {error && <p className="font-body text-xs text-danger mt-1">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-body font-semibold btn-accent flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="animate-pulse">Gönderiliyor...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Sıfırlama Bağlantısı Gönder
            </>
          )}
        </button>
      </form>

      <p className="text-center font-body text-sm text-muted-foreground mt-6">
        <Link href="/giris" className="flex items-center justify-center gap-1 text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Giriş sayfasına dön
        </Link>
      </p>
    </div>
  );
}
