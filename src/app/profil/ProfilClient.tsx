"use client";

import { useState } from "react";
import { User, Phone, Save, Check, AlertCircle, KeyRound, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  fullName: string;
  phone: string | null;
  email: string;
  creditBalance: number;
  createdAt: string;
}

export default function ProfilClient({ fullName, phone, email, creditBalance, createdAt }: Props) {
  const [name, setName] = useState(fullName);
  const [phoneVal, setPhoneVal] = useState(phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Ad soyad boş olamaz."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profil/guncelle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, phone: phoneVal }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Hata oluştu"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profil bilgileri formu */}
      <div className="card">
        <h2 className="font-heading text-lg font-bold text-primary mb-5">Profil Bilgileri</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="font-body text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Ad Soyad</span>
            </label>
            <input
              type="text"
              className="input-field w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız Soyadınız"
              required
            />
          </div>

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
              E-posta
            </label>
            <input
              type="email"
              className="input-field w-full opacity-60 cursor-not-allowed"
              value={email}
              readOnly
              title="E-posta değiştirilemez"
            />
            <p className="font-body text-xs text-muted-foreground mt-1">E-posta adresi değiştirilemez.</p>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefon</span>
            </label>
            <input
              type="tel"
              className="input-field w-full"
              value={phoneVal}
              onChange={(e) => setPhoneVal(e.target.value)}
              placeholder="0532 000 00 00"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Kaydediliyor...</>
              ) : saved ? (
                <><Check className="w-4 h-4" /> Kaydedildi</>
              ) : (
                <><Save className="w-4 h-4" /> Değişiklikleri Kaydet</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Hesap özeti */}
      <div className="card">
        <h2 className="font-heading text-base font-bold text-primary mb-4">Hesap Özeti</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="font-body text-sm text-muted-foreground">Mevcut Kredi</span>
            <span className="font-heading text-base font-bold text-accent">{creditBalance} kredi</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="font-body text-sm text-muted-foreground">Üyelik Tarihi</span>
            <span className="font-body text-sm text-foreground">
              {new Date(createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-body text-sm text-muted-foreground">Hesap Türü</span>
            <span className="font-body text-sm font-medium text-foreground">Vatandaş</span>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Link href="/kredi" className="btn-accent text-sm flex items-center gap-1.5 flex-1 justify-center">
            Kredi Satın Al
          </Link>
          <Link href="/kredi" className="btn-outline text-sm flex items-center gap-1.5 flex-1 justify-center">
            <ExternalLink className="w-3.5 h-3.5" /> İşlem Geçmişi
          </Link>
        </div>
      </div>

      {/* Şifre */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-primary flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Şifre
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Şifrenizi değiştirmek için e-postanıza sıfırlama bağlantısı gönderilir.
            </p>
          </div>
          <a
            href="/giris?action=sifremi-unuttum"
            className="btn-outline text-sm whitespace-nowrap"
          >
            Şifre Sıfırla
          </a>
        </div>
      </div>
    </div>
  );
}
