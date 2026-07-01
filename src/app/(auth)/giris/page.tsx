"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";

function GirisForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = "E-posta zorunludur";
    if (!form.password) errs.password = "Şifre zorunludur";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setServerError(null);

    const formData = new FormData();
    formData.set("email", form.email);
    formData.set("password", form.password);
    if (redirect) formData.set("redirect", redirect);

    try {
      const result = await loginAction(formData);

      if ("error" in result) {
        setServerError(result.error);
        setLoading(false);
        return;
      }

      // Başarılı giriş: tam sayfa navigasyon (cookie'lerin doğru okunması için)
      // router.push yerine window.location.href — session cookie'nin sunucuya
      // doğru gitmesini garantiler, Next.js client-side cache'i atlar.
      window.location.href = result.destination;
      // loading spinner giriş sayfasından ayrılana kadar görünür kalsın
    } catch {
      setServerError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden bg-[#0f1729] mb-4 shadow-lg">
          <Image src="/logo.png" alt="Mizanım" width={64} height={64} className="w-full h-full object-cover" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Tekrar Hoşgeldiniz
        </h1>
        <p className="font-body text-muted-foreground mt-1">
          Hesabınıza giriş yapın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="font-body text-sm font-semibold text-foreground block mb-1">
            E-posta
          </label>
          <input
            type="email"
            className={`input-field ${errors.email ? "border-danger" : ""}`}
            placeholder="ornek@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
          {errors.email && (
            <p className="font-body text-xs text-danger mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-body text-sm font-semibold text-foreground">
              Şifre
            </label>
            <Link
              href="/sifremi-unuttum"
              className="font-body text-xs text-accent hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`input-field pr-12 ${errors.password ? "border-danger" : ""}`}
              placeholder="Şifreniz"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="font-body text-xs text-danger mt-1">{errors.password}</p>
          )}
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
            <p className="font-body text-sm text-danger">{serverError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="animate-pulse">Giriş yapılıyor...</span>
          ) : (
            <>
              Giriş Yap
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 font-body text-xs text-muted-foreground">
            veya
          </span>
        </div>
      </div>

      {/* Register Link */}
      <div className="text-center">
        <p className="font-body text-sm text-muted-foreground mb-3">
          Hesabınız yok mu?
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/kayit?tip=vatandas"
            className="flex-1 btn-outline py-2.5 text-sm text-center"
          >
            Vatandaş Kaydı
          </Link>
          <Link
            href="/kayit?tip=avukat"
            className="flex-1 btn-primary py-2.5 text-sm text-center"
          >
            Avukat Kaydı
          </Link>
        </div>
      </div>

    </div>
  );
}

export default function GirisPage() {
  return (
    <Suspense fallback={<div className="animate-pulse font-body text-muted-foreground">Yükleniyor...</div>}>
      <GirisForm />
    </Suspense>
  );
}

