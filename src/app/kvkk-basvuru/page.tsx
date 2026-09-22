"use client";

import { useState } from "react";
import Link from "next/link";

const TALEP_SECENEKLERI = [
  "İşlenip işlenmediğini öğrenmek istiyorum",
  "İşlenmişse bilgi talep ediyorum",
  "İşlenme amacını öğrenmek istiyorum",
  "Aktarıldığı üçüncü kişileri öğrenmek istiyorum",
  "Düzeltilmesini istiyorum",
  "Silinmesini/yok edilmesini istiyorum",
  "Düzeltme/silmenin aktarılan kişilere bildirilmesini istiyorum",
  "Otomatik analiz sonucuna itiraz ediyorum",
  "Zararımın giderilmesini talep ediyorum",
  "Diğer",
];

export default function KvkkBasvuruPage() {
  const [form, setForm] = useState({
    ad_soyad: "", kimlik_no: "", adres: "", eposta: "", telefon: "", iliski: "", aciklama: "",
  });
  const [talepler, setTalepler] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState(false);

  function toggleTalep(t: string) {
    setTalepler((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    if (!form.ad_soyad || !form.kimlik_no || !form.adres || talepler.length === 0 || !form.aciklama) {
      setHata("Lütfen zorunlu alanları doldurun ve en az bir talep konusu seçin.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/kvkk-basvuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, talep_konusu: talepler }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setHata(j.error ?? "Başvuru gönderilemedi.");
        return;
      }
      setBasarili(true);
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (basarili) {
    return (
      <article className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-cream mb-3">Başvurunuz Alındı</h1>
        <p className="font-inter text-sm text-cream/70">
          Başvurunuz en geç 30 gün içinde, size bildirdiğiniz iletişim bilgisi üzerinden
          yanıtlanacaktır.
        </p>
      </article>
    );
  }

  return (
    <article className="max-w-xl mx-auto px-5 py-16">
      <h1 className="font-heading text-3xl font-bold text-cream mb-2">İlgili Kişi Başvuru Formu</h1>
      <p className="font-inter text-sm text-cream/60 mb-8">
        6698 sayılı KVKK m.11 kapsamındaki haklarınızı kullanmak için bu formu doldurun. Detaylı
        bilgi için{" "}
        <Link href="/sozlesmeler/ilgili-kisi-basvuru-formu" className="text-gold-300 underline">
          form metnine
        </Link>{" "}
        bakabilirsiniz.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30"
          placeholder="Ad Soyad *"
          value={form.ad_soyad}
          onChange={(e) => setForm({ ...form, ad_soyad: e.target.value })}
        />
        <input
          className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30"
          placeholder="T.C. Kimlik No / Pasaport No *"
          value={form.kimlik_no}
          onChange={(e) => setForm({ ...form, kimlik_no: e.target.value })}
        />
        <textarea
          className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30"
          placeholder="Tebligata esas adres *"
          rows={2}
          value={form.adres}
          onChange={(e) => setForm({ ...form, adres: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30"
            placeholder="E-posta"
            value={form.eposta}
            onChange={(e) => setForm({ ...form, eposta: e.target.value })}
          />
          <input
            className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30"
            placeholder="Telefon"
            value={form.telefon}
            onChange={(e) => setForm({ ...form, telefon: e.target.value })}
          />
        </div>
        <input
          className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30"
          placeholder="Mizanım ile ilişkiniz (kullanıcı / müvekkil / karşı taraf / diğer)"
          value={form.iliski}
          onChange={(e) => setForm({ ...form, iliski: e.target.value })}
        />

        <div>
          <p className="font-inter text-xs uppercase tracking-wide text-gold-500 mb-2">Talep Konusu *</p>
          <div className="space-y-1.5">
            {TALEP_SECENEKLERI.map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={talepler.includes(t)}
                  onChange={() => toggleTalep(t)}
                  className="w-4 h-4"
                />
                <span className="font-inter text-sm text-cream/80">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <textarea
          className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30"
          placeholder="Talebinizin açıklaması *"
          rows={4}
          value={form.aciklama}
          onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
        />

        {hata && <p className="font-inter text-sm text-red-400">{hata}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
        </button>
      </form>
    </article>
  );
}
