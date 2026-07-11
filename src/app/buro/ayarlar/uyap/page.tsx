/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Globe, Download, KeyRound, Lock, ShieldCheck } from "lucide-react";
import EklentiBaglanti from "@/components/buro/EklentiBaglanti";

export default async function UyapAyarlarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const svc = createServiceClient() as any;
  const { data: profile } = await svc
    .from("profiles")
    .select("user_type, uyap_uets_active")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/panel");

  // Max paketi olmayan avukata kilit ekranı
  if (!profile.uyap_uets_active) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0f1729] flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-[#c9a84c]" />
          </div>
          <h1 className="font-heading text-xl font-bold text-primary mb-2">
            UYAP/UETS Eklentisi — Avukat Max&apos;e Özel
          </h1>
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">
            Chrome eklentisi ile UYAP dosyalarınızı ve UETS tebligatlarınızı Mizanım&apos;a
            otomatik aktarma özelliği yalnızca <strong>Avukat Max</strong> paketinde sunulur.
          </p>
          <Link href="/kredi-yukle" className="btn-primary inline-block px-8">
            Max Paketine Geç
          </Link>
        </div>
      </div>
    );
  }

  const adimlar = [
    {
      ikon: Globe,
      baslik: "Chrome'a ekleyin",
      metin: "Aşağıdaki \"Chrome'a Ekle\" düğmesiyle eklentiyi Chrome Web Store'dan tek tıkla kurun.",
    },
    {
      ikon: KeyRound,
      baslik: "Bağlantı kodu ile eşleştirin",
      metin: "Aşağıdan bağlantı kodu üretin ve eklentinin ayarlar ekranına yapıştırın. Kod, hesabınızı eklentiyle güvenli şekilde eşleştirir.",
    },
    {
      ikon: Download,
      baslik: "UYAP'a girin ve aktarın",
      metin: "UYAP Avukat Portal'a e-imzanızla girin, eklentide \"Sayfayı Tara\" → \"Mizanım'a Aktar\" deyin. Dosyalar Davalar sayfanıza işlenir.",
    },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0f1729] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#c9a84c]" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-primary">UYAP/UETS Eklenti Kurulumu</h1>
          <p className="font-body text-sm text-muted-foreground">
            mizanim-uyap-uets-v1.1.0 · Avukat Max paketinizde aktif
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6">
        <ol className="space-y-5">
          {adimlar.map((adim, i) => (
            <li key={adim.baslik} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-heading font-bold text-sm flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-primary flex items-center gap-2">
                  <adim.ikon className="w-4 h-4 text-accent" />
                  {adim.baslik}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">{adim.metin}</p>
              </div>
            </li>
          ))}
        </ol>
        <a
          href="https://chromewebstore.google.com/detail/ancbdklmehchmpefmjcachkidbgjapfm"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-sm"
        >
          <Globe className="w-4 h-4" />
          Chrome&apos;a Ekle — Web Store
        </a>
      </div>

      <EklentiBaglanti />
    </div>
  );
}
