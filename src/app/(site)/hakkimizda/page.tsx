import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Scale, ShieldCheck, Cpu, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Hakkımızda — Mizanım | Adaletin Dijital Terazisi",
  description:
    "Mizanım'ın hikâyesi, misyonu ve teknolojisi. Hukuk pratiğini yapay zekâyla kolaylaştıran, meslek sırrına saygılı Türk hukuk platformu.",
  alternates: { canonical: "/hakkimizda" },
  openGraph: {
    title: "Hakkımızda — Mizanım",
    description: "Adaletin dijital terazisini kuran ekip ve teknoloji.",
    images: ["/images/logo.png"],
  },
};

interface Value {
  icon: typeof Scale;
  title: string;
  body: string;
}

const VALUES: Value[] = [
  {
    icon: Scale,
    title: "Denge",
    body: "Adımız mizandan gelir: terazi. Avukatın uzmanlığı ile teknolojinin hızını aynı kefede tutarız — biri diğerinin yerine geçmez.",
  },
  {
    icon: ShieldCheck,
    title: "Mahremiyet",
    body: "Meslek sırrı bizim için bir pazarlama cümlesi değil, tasarım ilkesidir. Veriler model eğitiminde kullanılmaz, üçüncü taraflara satılmaz.",
  },
  {
    icon: Cpu,
    title: "Teknoloji",
    body: "Anlam temelli emsal arama, dava bağlamını bilen asistan, UYAP ve UETS entegrasyonu — hepsi Türk hukuku için, Türkçe düşünerek geliştirildi.",
  },
  {
    icon: HeartHandshake,
    title: "Erişilebilirlik",
    body: "Hukuk yalnızca hukukçulara anlaşılır olmamalı. Vatandaş panelimiz, hakkını arayan herkese sade bir dille yol gösterir.",
  },
];

// Hakkımızda: hikâye, misyon ve teknoloji anlatısı
export default function HakkimizdaPage() {
  return (
    <>
      {/* Başlık */}
      <section className="bg-navy-950 pt-32 md:pt-40 pb-16">
        <div className="mx-auto max-w-4xl px-5 md:px-8 text-center">
          <span className="relative inline-block w-20 h-20 rounded-2xl overflow-hidden bg-navy-900 ring-1 ring-gold-500/30 mb-8">
            <Image src="/images/logo.png" alt="Mizanım logosu" fill sizes="80px" className="object-cover" />
          </span>
          <h1 className="font-heading font-bold text-cream leading-tight [font-size:clamp(2.5rem,5vw,4.5rem)]">
            Teraziyi yeniden <span className="text-gold-400">kurduk</span>.
          </h1>
          <p className="font-inter text-cream/60 text-base md:text-lg leading-[1.7] max-w-2xl mx-auto mt-6">
            Mizanım, hukuk pratiğinin en çok zaman alan işlerini — emsal taramak, dilekçe
            yazmak, dosya takip etmek — yapay zekâyla dakikalara indiren, Türkiye&apos;ye
            özgü çift portallı bir hukuk platformudur.
          </p>
        </div>
      </section>

      {/* Hikâye */}
      <section className="bg-navy-900 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div className="border-l-2 border-gold-500 pl-6 space-y-6">
            <h2 className="font-heading text-3xl font-bold text-cream">Hikâyemiz</h2>
            <p className="font-inter text-cream/65 text-base md:text-lg leading-[1.8]">
              Bir avukatın gününün büyük bölümü mahkeme salonunda değil; karar
              veritabanlarında, dilekçe taslaklarında ve dosya klasörlerinde geçer.
              Mizanım, bu görünmeyen mesaiyi kısaltmak için doğdu.
            </p>
            <p className="font-inter text-cream/65 text-base md:text-lg leading-[1.8]">
              Aynı soruyu diğer taraftan soran vatandaşı da unutmadık: &ldquo;Bu sözleşme
              beni bağlar mı? Bu davada emsal ne diyor?&rdquo; Vatandaş paneli, hukuku
              anlaşılır kılmak için aynı motorun sade yüzüdür.
            </p>
            <p className="font-inter text-cream/65 text-base md:text-lg leading-[1.8]">
              Bugün Mizanım; emsal arama, belge analizi, dilekçe üretimi, büro yönetimi,
              UYAP ve UETS aktarımını tek çatı altında topluyor. Hedefimiz basit: avukat
              hukuka, vatandaş hakkına odaklansın — mekanik işleri terazi tartsın.
            </p>
          </div>
        </div>
      </section>

      {/* Değerler */}
      <section className="bg-navy-950 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-[11px] font-inter font-semibold uppercase tracking-[0.25em] text-gold-500">
              <span aria-hidden className="h-px w-8 bg-gold-500/60" />
              Değerlerimiz
              <span aria-hidden className="h-px w-8 bg-gold-500/60" />
            </span>
            <h2 className="font-heading font-bold text-cream mt-4 [font-size:clamp(2rem,3.5vw,3rem)]">
              Dört ayaklı bir kaide
            </h2>
          </div>

          <ul className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <li key={v.title} className="bg-navy-800 border border-navy-700 rounded-xl p-7 hover:border-gold-500/40 transition-colors">
                <v.icon aria-hidden className="w-7 h-7 text-gold-500 mb-4" />
                <h3 className="font-heading text-xl font-bold text-cream mb-2">{v.title}</h3>
                <p className="font-inter text-sm text-cream/60 leading-[1.7]">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Teknoloji */}
      <section className="bg-navy-900 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div className="border-l-2 border-gold-500 pl-6 space-y-6">
            <h2 className="font-heading text-3xl font-bold text-cream">Teknolojimiz</h2>
            <p className="font-inter text-cream/65 text-base md:text-lg leading-[1.8]">
              Emsal aramada anahtar kelime eşleşmesinin ötesine geçen anlam temelli
              (semantik) arama kullanıyoruz: kararlar vektör uzayında temsil edilir,
              sorunuza hukuken en yakın kararlar önce gelir. Sonuçlar, çok dilli yeniden
              sıralama modeliyle bir kez daha tartılır.
            </p>
            <p className="font-inter text-cream/65 text-base md:text-lg leading-[1.8]">
              MizanAI asistanı, dava dosyanızın bağlamını — tarafları, süreleri, finans
              kayıtlarını — bilerek yanıt üretir. UYAP ve UETS aktarımı ise tarayıcı
              eklentisiyle, yalnızca sizin açtığınız oturumda ve onayınızla çalışır;
              şifrenize veya e-imzanıza hiçbir zaman erişmez.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/ozellikler"
              className="inline-block px-8 py-4 rounded-md font-inter text-sm font-semibold text-navy-950 bg-gold-500 hover:bg-gold-400 transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              Özellikleri Keşfedin
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
