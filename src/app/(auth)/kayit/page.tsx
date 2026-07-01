"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Briefcase, Users, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import type { UserType } from "@/types/database";

type Step = "tip" | "form";

function KayitForm() {
  const searchParams = useSearchParams();
  const tipParam = searchParams.get("tip") as UserType | null;

  const [step, setStep] = useState<Step>(tipParam ? "form" : "tip");
  const [userType, setUserType] = useState<UserType>(tipParam ?? "vatandas");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    bar_number: "",
    terms: false,
    kvkk: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleTypeSelect(type: UserType) {
    setUserType(type);
    setStep("form");
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Ad Soyad zorunludur";
    if (!form.email.trim()) errs.email = "E-posta zorunludur";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Geçerli bir e-posta girin";
    if (!form.password) errs.password = "Şifre zorunludur";
    else if (form.password.length < 8)
      errs.password = "Şifre en az 8 karakter olmalı";
    if (userType === "avukat" && !form.bar_number.trim())
      errs.bar_number = "Baro sicil numarası zorunludur";
    if (!form.terms) errs.terms = "Kullanım şartlarını kabul etmelisiniz";
    if (!form.kvkk) errs.kvkk = "KVKK aydınlatma metnini onaylamanız gereklidir";
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

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          user_type: userType,
          phone: form.phone || undefined,
          bar_number: form.bar_number || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Kayıt başarısız.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dogrulama-bekliyor";
      }, 1500);
    } catch {
      setServerError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "tip") {
    return (
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary mb-2">
            Hesap Oluşturun
          </h1>
          <p className="font-body text-muted-foreground">
            Nasıl kullanacaksınız?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Vatandaş */}
          <button
            onClick={() => handleTypeSelect("vatandas")}
            className="card hover:border-accent hover:shadow-gold transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-heading text-lg font-bold text-primary mb-2">
              Vatandaş
            </h3>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Hukuki sorularım var, belge analizi ve dilekçe üretmek istiyorum.
            </p>
            <div className="flex items-center gap-1 text-accent text-sm font-body">
              <CheckCircle className="w-4 h-4" />
              <span>20 kredi hediye</span>
            </div>
          </button>

          {/* Avukat */}
          <button
            onClick={() => handleTypeSelect("avukat")}
            className="card hover:border-primary hover:shadow-elevated transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading text-lg font-bold text-primary mb-2">
              Avukat
            </h3>
            <p className="font-body text-sm text-muted-foreground mb-4">
              CRM, dava takibi, UYAP entegrasyonu ve AI araçları kullanmak istiyorum.
            </p>
            <div className="flex items-center gap-1 text-primary text-sm font-body">
              <CheckCircle className="w-4 h-4" />
              <span>14 gün ücretsiz</span>
            </div>
          </button>
        </div>

        <p className="text-center font-body text-sm text-muted-foreground mt-6">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="text-accent hover:underline font-semibold">
            Giriş Yapın
          </Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-primary mb-2">Hesabınız Oluşturuldu!</h2>
        <p className="font-body text-muted-foreground mb-2">
          E-posta doğrulama bağlantısı gönderildi...
        </p>
        <p className="font-body text-sm text-muted-foreground">Lütfen e-postanızı kontrol edin.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 mb-4">
          {userType === "avukat" ? (
            <Briefcase className="w-4 h-4 text-primary" />
          ) : (
            <Users className="w-4 h-4 text-accent" />
          )}
          <span className="font-body text-sm text-foreground capitalize">
            {userType === "avukat" ? "Avukat" : "Vatandaş"} Kaydı
          </span>
          <button
            onClick={() => setStep("tip")}
            className="text-xs text-muted-foreground hover:text-accent ml-1 transition-colors"
          >
            (değiştir)
          </button>
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Hesap Oluşturun
        </h1>
        {userType === "vatandas" && (
          <p className="font-body text-sm text-success mt-1 flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Kayıtta 20 kredi hediye!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="font-body text-sm font-semibold text-foreground block mb-1">
            Ad Soyad
          </label>
          <input
            type="text"
            className={`input-field ${errors.full_name ? "border-danger" : ""}`}
            placeholder="Adınız Soyadınız"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          {errors.full_name && (
            <p className="font-body text-xs text-danger mt-1">{errors.full_name}</p>
          )}
        </div>

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
          />
          {errors.email && (
            <p className="font-body text-xs text-danger mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="font-body text-sm font-semibold text-foreground block mb-1">
            Şifre
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`input-field pr-12 ${errors.password ? "border-danger" : ""}`}
              placeholder="En az 8 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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

        {/* Phone (optional) */}
        <div>
          <label className="font-body text-sm font-semibold text-foreground block mb-1">
            Telefon{" "}
            <span className="text-muted-foreground font-normal">(opsiyonel)</span>
          </label>
          <input
            type="tel"
            className="input-field"
            placeholder="+90 5xx xxx xx xx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {/* Bar Number (avukat only) */}
        {userType === "avukat" && (
          <div>
            <label className="font-body text-sm font-semibold text-foreground block mb-1">
              Baro Sicil Numarası
            </label>
            <input
              type="text"
              className={`input-field ${errors.bar_number ? "border-danger" : ""}`}
              placeholder="Baro sicil no"
              value={form.bar_number}
              onChange={(e) => setForm({ ...form, bar_number: e.target.value })}
            />
            {errors.bar_number && (
              <p className="font-body text-xs text-danger mt-1">{errors.bar_number}</p>
            )}
          </div>
        )}

        {/* KVKK */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-accent flex-shrink-0"
              checked={form.kvkk}
              onChange={(e) => setForm({ ...form, kvkk: e.target.checked })}
            />
            <span className="font-body text-sm text-foreground">
              <Link href="/gizlilik-politikasi" className="text-accent hover:underline">
                KVKK Aydınlatma Metnini
              </Link>{" "}
              okudum, kişisel verilerimin işlenmesine onay veriyorum.
            </span>
          </label>
          {errors.kvkk && (
            <p className="font-body text-xs text-danger mt-1">{errors.kvkk}</p>
          )}
        </div>

        {/* Terms */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-accent flex-shrink-0"
              checked={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.checked })}
            />
            <span className="font-body text-sm text-foreground">
              <Link href="/kullanim-sartlari" className="text-accent hover:underline">
                Kullanım Şartları
              </Link>
              &apos;nı okudum, kabul ediyorum.
            </span>
          </label>
          {errors.terms && (
            <p className="font-body text-xs text-danger mt-1">{errors.terms}</p>
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
          className={`w-full py-3 rounded-lg font-body font-semibold flex items-center justify-center gap-2 transition-all ${
            userType === "avukat" ? "btn-primary" : "btn-accent"
          }`}
        >
          {loading ? (
            <span className="animate-pulse">Kaydediliyor...</span>
          ) : (
            <>
              Hesap Oluştur
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-center font-body text-sm text-muted-foreground mt-6">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="text-accent hover:underline font-semibold">
          Giriş Yapın
        </Link>
      </p>
    </div>
  );
}

export default function KayitPage() {
  return (
    <Suspense fallback={<div className="animate-pulse font-body text-muted-foreground">Yükleniyor...</div>}>
      <KayitForm />
    </Suspense>
  );
}
