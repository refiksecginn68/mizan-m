"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, Phone, Clock, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";

// İletişim & Destek sayfası — form birincil kanal (mesajlar DB'ye kaydedilir)
export default function IletisimPage() {
  const [adSoyad, setAdSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [konu, setKonu] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [kvkkOnay, setKvkkOnay] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot — gerçek kullanıcı doldurmaz
  const [durum, setDurum] = useState<"bekliyor" | "gonderiliyor" | "basarili" | "hata">("bekliyor");
  const [hataMesaji, setHataMesaji] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side doğrulama
    if (!adSoyad.trim() || !email.trim() || !konu.trim() || !mesaj.trim()) {
      setDurum("hata");
      setHataMesaji("Lütfen tüm alanları doldurun.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDurum("hata");
      setHataMesaji("Geçerli bir e-posta adresi giriniz.");
      return;
    }
    if (!kvkkOnay) {
      setDurum("hata");
      setHataMesaji("Devam etmek için KVKK onayı gereklidir.");
      return;
    }

    setDurum("gonderiliyor");
    setHataMesaji("");
    try {
      const res = await fetch("/api/iletisim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adSoyad, email, konu, mesaj, website }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setDurum("basarili");
        setAdSoyad(""); setEmail(""); setKonu(""); setMesaj(""); setKvkkOnay(false);
      } else {
        setDurum("hata");
        setHataMesaji(data?.error ?? "Mesajınız iletilemedi. Lütfen tekrar deneyin.");
      }
    } catch {
      setDurum("hata");
      setHataMesaji("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary py-4 px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-white">Mizanım</span>
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="font-heading text-3xl font-bold text-primary mb-2">İletişim &amp; Destek</h1>
        <p className="text-muted-foreground mb-10">
          Sorularınız, öneri ve destek talepleriniz için bize ulaşın.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* SOL — iletişim bilgileri kartı */}
          <div className="md:col-span-2">
            <div className="rounded-2xl bg-primary p-6 text-white space-y-6">
              <h2 className="font-heading text-lg font-bold">İletişim Bilgileri</h2>

              <a href="tel:+905301139021" className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-white/50">Telefon</p>
                  <p className="text-sm font-semibold group-hover:text-accent transition-colors">
                    0530 113 90 21
                  </p>
                </div>
              </a>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-white/50">Çalışma Saatleri</p>
                  <p className="text-sm font-semibold">Hafta içi 09:00–18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-white/50">Yazılı Destek</p>
                  <p className="text-sm font-semibold">
                    En hızlı yanıt için yandaki formu kullanın — mesajınız doğrudan destek
                    ekibimize ulaşır.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SAĞ — form */}
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
              {/* Honeypot — görünmez, botlar doldurur */}
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
                name="website"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adSoyad" className="block text-sm font-medium text-foreground mb-1.5">
                    Ad Soyad
                  </label>
                  <input
                    id="adSoyad"
                    type="text"
                    value={adSoyad}
                    onChange={(e) => setAdSoyad(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                    E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@eposta.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="konu" className="block text-sm font-medium text-foreground mb-1.5">
                  Konu
                </label>
                <input
                  id="konu"
                  type="text"
                  value={konu}
                  onChange={(e) => setKonu(e.target.value)}
                  placeholder="Mesajınızın konusu"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mesaj" className="block text-sm font-medium text-foreground mb-1.5">
                  Mesaj
                </label>
                <textarea
                  id="mesaj"
                  value={mesaj}
                  onChange={(e) => setMesaj(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  rows={6}
                  className={inputClass}
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kvkkOnay}
                  onChange={(e) => setKvkkOnay(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-[#c9a84c]"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Verilerimin talebimi yanıtlamak amacıyla işlenmesini kabul ediyorum.{" "}
                  <Link href="/gizlilik-politikasi" className="text-accent hover:underline">
                    Gizlilik Politikası
                  </Link>
                </span>
              </label>

              {durum === "basarili" && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Mesajınız iletildi. En kısa sürede size dönüş yapacağız.
                </div>
              )}
              {durum === "hata" && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {hataMesaji}
                </div>
              )}

              <button
                type="submit"
                disabled={durum === "gonderiliyor"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg gradient-gold px-8 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {durum === "gonderiliyor" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Gönder
                  </>
                )}
              </button>

              <p className="text-[11px] text-muted-foreground pt-1">
                İletişim bilgileriniz yalnızca talebinizi yanıtlamak için kullanılır, üçüncü
                taraflarla paylaşılmaz.{" "}
                <Link href="/gizlilik-politikasi" className="text-accent hover:underline">
                  Gizlilik Politikası
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground space-x-4">
        <Link href="/gizlilik-politikasi" className="hover:text-accent">Gizlilik Politikası</Link>
        <Link href="/kullanim-sartlari" className="hover:text-accent">Kullanım Şartları</Link>
        <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-accent">Mesafeli Satış</Link>
        <Link href="/cerez-politikasi" className="hover:text-accent">Çerez Politikası</Link>
        <span>© 2026 Mizanım</span>
      </footer>
    </div>
  );
}
