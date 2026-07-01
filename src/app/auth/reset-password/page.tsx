"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase sıfırlama tokenını hash'ten alır
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // URL'de access_token varsa da ready
    if (searchParams.get("type") === "recovery") setReady(true);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: sbError } = await supabase.auth.updateUser({ password });
    if (sbError) {
      setError("Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir.");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/giris"), 2500);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-primary mb-2">Şifre Güncellendi</h2>
        <p className="font-body text-muted-foreground">Giriş sayfasına yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-heading text-2xl font-bold text-primary mb-2">Yeni Şifre Belirle</h1>
        <p className="font-body text-sm text-muted-foreground">En az 8 karakter kullanın.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-sm font-semibold text-foreground block mb-1">Yeni Şifre</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="input-field pr-12"
              placeholder="En az 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="font-body text-sm font-semibold text-foreground block mb-1">Şifre Tekrar</label>
          <input
            type="password"
            className="input-field"
            placeholder="Şifrenizi tekrar girin"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
            <p className="font-body text-sm text-danger">{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !ready}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <span className="animate-pulse">Güncelleniyor...</span> : (
            <><ArrowRight className="w-4 h-4" />Şifreyi Güncelle</>
          )}
        </button>
      </form>

      <p className="text-center mt-4">
        <Link href="/giris" className="font-body text-sm text-accent hover:underline">Giriş sayfasına dön</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={<div className="animate-pulse text-muted-foreground font-body">Yükleniyor...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
