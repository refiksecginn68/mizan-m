"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, Clock, Loader2, CheckCircle2, AlertCircle, Send, Building2 } from "lucide-react";
import SectionHeading from "@/components/landing/section-heading";

// Konu seçenekleri — Büro planı ve KVKK soruları ayrı kanal olarak öne çıkarılır
const KONULAR = [
  "Genel soru",
  "Büro planı talebi (5+ kullanıcı)",
  "KVKK / veri güvenliği sorusu",
  "Teknik destek",
  "Fatura ve ödeme",
  "Geri bildirim / öneri",
] as const;

// İletişim sayfası: form birincil kanal (mesajlar /api/iletisim ile DB'ye kaydedilir)
export default function IletisimPage() {
  const [adSoyad, setAdSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [konu, setKonu] = useState<string>(KONULAR[0]);
  const [mesaj, setMesaj] = useState("");
  const [kvkkOnay, setKvkkOnay] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot — gerçek kullanıcı doldurmaz
  const [durum, setDurum] = useState<"bekliyor" | "gonderiliyor" | "basarili" | "hata">("bekliyor");
  const [hataMesaji, setHataMesaji] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!adSoyad.trim() || !email.trim() || !mesaj.trim()) {
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
        setAdSoyad(""); setEmail(""); setKonu(KONULAR[0]); setMesaj(""); setKvkkOnay(false);
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
    "w-full rounded-md border border-navy-700 bg-navy-900 px-4 py-3 font-inter text-sm text-cream " +
    "placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500/60 transition-colors";

  return (
    <>
      <section className="bg-navy-950 pt-32 md:pt-40 pb-10">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <SectionHeading
            eyebrow="İletişim"
            title="Size nasıl yardımcı olabiliriz?"
            description="Soru, öneri, büro talebi veya KVKK başvurusu — mesajınız doğrudan ekibimize ulaşır."
          />
        </div>
      </section>

      <section className="bg-navy-950 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8 grid lg:grid-cols-5 gap-8">
          {/* Sol — iletişim bilgileri */}
          <motion.aside
            className="lg:col-span-2 space-y-4"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-6">
              <h2 className="font-heading text-lg font-bold text-cream border-l-2 border-gold-500 pl-3">
                İletişim Bilgileri
              </h2>

              <a href="tel:+905301139021" className="flex items-start gap-3 group">
                <span className="w-10 h-10 rounded-md bg-navy-900 border border-navy-700 flex items-center justify-center flex-shrink-0">
                  <Phone aria-hidden className="w-4 h-4 text-gold-500" />
                </span>
                <span>
                  <span className="block font-inter text-xs text-cream/40">Telefon</span>
                  <span className="block font-inter text-sm font-semibold text-cream group-hover:text-gold-300 transition-colors">
                    0530 113 90 21
                  </span>
                </span>
              </a>

              <a href="mailto:refiksecginn@hotmail.com" className="flex items-start gap-3 group">
                <span className="w-10 h-10 rounded-md bg-navy-900 border border-navy-700 flex items-center justify-center flex-shrink-0">
                  <Mail aria-hidden className="w-4 h-4 text-gold-500" />
                </span>
                <span>
                  <span className="block font-inter text-xs text-cream/40">E-posta</span>
                  <span className="block font-inter text-sm font-semibold text-cream group-hover:text-gold-300 transition-colors break-all">
                    refiksecginn@hotmail.com
                  </span>
                </span>
              </a>

              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-md bg-navy-900 border border-navy-700 flex items-center justify-center flex-shrink-0">
                  <Clock aria-hidden className="w-4 h-4 text-gold-500" />
                </span>
                <span>
                  <span className="block font-inter text-xs text-cream/40">Çalışma Saatleri</span>
                  <span className="block font-inter text-sm font-semibold text-cream">Hafta içi 09:00–18:00</span>
                </span>
              </div>
            </div>

            <div className="bg-navy-800 border border-gold-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 aria-hidden className="w-4 h-4 text-gold-500" />
                <h3 className="font-inter text-sm font-semibold text-cream">Büro planı mı arıyorsunuz?</h3>
              </div>
              <p className="font-inter text-xs text-cream/55 leading-relaxed">
                5+ kullanıcılı bürolar için havuz kota ve özel fiyatlandırma sunuyoruz.
                Konu alanında &ldquo;Büro planı talebi&rdquo;ni seçin; aynı gün dönüş yapalım.
              </p>
            </div>
          </motion.aside>

          {/* Sağ — form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSubmit} className="bg-navy-800 border border-navy-700 rounded-xl p-6 md:p-8 space-y-5">
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

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="adSoyad" className="block font-inter text-sm font-medium text-cream/80 mb-2">
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
                  <label htmlFor="email" className="block font-inter text-sm font-medium text-cream/80 mb-2">
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
                <label htmlFor="konu" className="block font-inter text-sm font-medium text-cream/80 mb-2">
                  Konu
                </label>
                <select
                  id="konu"
                  value={konu}
                  onChange={(e) => setKonu(e.target.value)}
                  className={inputClass}
                >
                  {KONULAR.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mesaj" className="block font-inter text-sm font-medium text-cream/80 mb-2">
                  Mesaj
                </label>
                <textarea
                  id="mesaj"
                  value={mesaj}
                  onChange={(e) => setMesaj(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  rows={6}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kvkkOnay}
                  onChange={(e) => setKvkkOnay(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-navy-700 accent-[#c9a84c]"
                />
                <span className="font-inter text-xs text-cream/50 leading-relaxed">
                  Verilerimin talebimi yanıtlamak amacıyla işlenmesini kabul ediyorum.{" "}
                  <Link href="/kvkk" className="text-gold-300 hover:text-gold-100 underline underline-offset-2">
                    KVKK Aydınlatma Metni
                  </Link>
                </span>
              </label>

              {durum === "basarili" && (
                <p role="status" className="flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/30 px-4 py-3 font-inter text-sm text-green-400">
                  <CheckCircle2 aria-hidden className="w-4 h-4 flex-shrink-0" />
                  Mesajınız iletildi. En kısa sürede size dönüş yapacağız.
                </p>
              )}
              {durum === "hata" && (
                <p role="alert" className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 font-inter text-sm text-red-400">
                  <AlertCircle aria-hidden className="w-4 h-4 flex-shrink-0" />
                  {hataMesaji}
                </p>
              )}

              <button
                type="submit"
                disabled={durum === "gonderiliyor"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-gold-500 hover:bg-gold-400 px-8 py-3 font-inter text-sm font-semibold text-navy-950 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
              >
                {durum === "gonderiliyor" ? (
                  <>
                    <Loader2 aria-hidden className="w-4 h-4 animate-spin" /> Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send aria-hidden className="w-4 h-4" /> Gönder
                  </>
                )}
              </button>

              <p className="font-inter text-[11px] text-cream/40 pt-1">
                İletişim bilgileriniz yalnızca talebinizi yanıtlamak için kullanılır, üçüncü
                taraflarla paylaşılmaz.{" "}
                <Link href="/gizlilik" className="text-gold-300 hover:text-gold-100 underline underline-offset-2">
                  Gizlilik Politikası
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
