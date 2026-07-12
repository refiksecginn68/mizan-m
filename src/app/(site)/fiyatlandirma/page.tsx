"use client";

import Link from "next/link";
import { Check, Star, Mail, ArrowRight, ShieldCheck, Scale, Sparkles, Landmark } from "lucide-react";

// NOT: Header ve footer (site) layout'undan gelir; bu sayfa yalnız içerik üretir.

export default function FiyatlandirmaPage() {
  const plans = [
    {
      name: "Vatandaş",
      tagline: "Hukuki rehberlik herkes için",
      price: "299₺",
      period: "ay",
      credits: "50 AI sorgu / ay",
      features: [
        "AI soru-cevap asistanı",
        "Belge analizi",
        "Dilekçe üretimi",
        "Sınırsız emsal + mevzuat arama",
      ],
      buttonText: "Hemen Başla",
      buttonHref: "/kayit",
      isPopular: false,
      accent: false,
    },
    {
      name: "Avukat Pro",
      tagline: "Profesyonel hukuk pratiği için",
      price: "1.990₺",
      period: "ay",
      credits: "750 AI sorgu / ay",
      features: [
        "Tüm AI modülleri (sohbet, AI özet, belge analizi, dilekçe)",
        "Sınırsız emsal + mevzuat arama",
        "CRM müvekkil yönetimi",
        "Dava dosya takibi",
        "Akıllı takvim & alarm",
        "Finans takibi",
      ],
      buttonText: "Pro'ya Başla",
      buttonHref: "/kayit?role=avukat",
      isPopular: true,
      accent: true,
    },
    {
      name: "Avukat Max",
      tagline: "Tam donanımlı profesyonel",
      price: "3.990₺",
      period: "ay",
      credits: "2.000 AI sorgu / ay",
      features: [
        "Avukat Pro'nun tüm özellikleri",
        "UYAP/UETS Chrome eklentisi aktivasyonu",
        "UETS e-tebligat entegrasyonu",
        "Öncelikli destek",
      ],
      buttonText: "Max'e Başla",
      buttonHref: "/kayit?role=avukat&plan=max",
      isPopular: false,
      accent: false,
    },
    {
      name: "Büro Planı",
      tagline: "Hukuk büroları için tam paket",
      price: "Fiyat Alınız",
      period: "ozel",
      credits: "Havuz kota / Esnek",
      features: [
        "Avukat Max'in tüm özellikleri",
        "+5 ortak kullanıcı",
        "Ortak dosya & CRM havuzu",
        "Büroya özel kota",
        "Kurumsal onboarding & eğitim",
        "Özel SLA & öncelikli destek",
      ],
      buttonText: "Bizimle İletişime Geçin",
      buttonHref: "/iletisim",
      isPopular: false,
      accent: false,
    },
  ];

  const kontorler = [
    { name: "100 Sorgu Kontör", price: "300₺", detail: "+100 AI sorgusu" },
    { name: "500 Sorgu Kontör", price: "1.300₺", detail: "+500 AI sorgusu" },
  ];

  return (
    <div className="bg-navy-950 text-white overflow-x-hidden selection:bg-[#c9a84c] selection:text-white">
      {/* İçerik */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-full px-4 py-1.5 mb-4 text-[#c9a84c] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Esnek ve Şeffaf Fiyatlandırma</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Bütçenize ve İhtiyacınıza Uygun <span className="text-[#c9a84c] bg-gradient-to-r from-[#c9a84c] to-[#f4d682] bg-clip-text text-transparent">Hukuk Paketleri</span>
          </h1>
          <p className="font-body text-gray-400 text-base sm:text-lg leading-relaxed">
            Vatandaşlar için kolaylaştırılmış hızlı çözümler, hukuk profesyonelleri için tam donanımlı baro entegrasyonları ve AI destekli araçlar.
          </p>

          <div className="inline-flex items-center gap-2 mt-8 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-gray-300">
            <Landmark className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span>Aylık havale/EFT ile ödeme — kredi kartı desteği yakında</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 ${
                plan.isPopular
                  ? "bg-gradient-to-b from-[#1a2744] to-[#0f1729] border-2 border-[#c9a84c] shadow-[0_0_30px_rgba(201,168,76,0.08)] scale-105 z-10"
                  : "bg-white/5 border border-white/5 hover:border-white/10"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-[#c9a84c] text-[#0f1729] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow">
                    <Star className="w-3 h-3 fill-current" />
                    En Popüler
                  </span>
                </div>
              )}

              {/* Title & Tagline */}
              <div className="mb-6">
                <h3 className="font-heading text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px]">{plan.tagline}</p>
              </div>

              {/* Price Area */}
              <div className="mb-6 flex flex-col justify-end">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
                    {plan.price}
                  </span>
                  {plan.period === "ay" && (
                    <span className="text-xs text-gray-400 font-medium">/ ay</span>
                  )}
                  {plan.period === "ozel" && (
                    <span className="text-xs text-gray-400 font-medium">esnek model</span>
                  )}
                </div>
                {plan.period === "ay" && (
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    {plan.credits} dahil
                  </p>
                )}
                {plan.period === "ozel" && (
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    Büronuza özel havuz kota ve çoklu kullanıcı
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Link
                href={plan.buttonHref}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-center transition-all duration-300 mb-6 flex items-center justify-center gap-1.5 ${
                  plan.accent
                    ? "bg-[#c9a84c] text-[#0f1729] hover:bg-[#b08f3b]"
                    : "bg-white/10 text-white hover:bg-white/15 border border-white/5"
                }`}
              >
                <span>{plan.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Features List */}
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-3">Paket İçeriği</p>
                <ul className="space-y-2.5 text-xs text-gray-300">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-tight">
                      <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.accent ? "text-[#c9a84c]" : "text-green-500"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Kontör Paketleri */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Kontör <span className="text-[#c9a84c]">(Ek Sorgu)</span> Paketleri
            </h2>
            <p className="font-body text-sm text-gray-400">
              Aylık kotanız bitti mi? Ek sorgu yükleyin — kontörler süresiz geçerlidir, ay sonunda silinmez.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {kontorler.map((k) => (
              <div key={k.name} className="bg-white/5 border border-white/5 hover:border-[#c9a84c]/30 rounded-3xl p-6 flex items-center justify-between transition-all duration-300">
                <div>
                  <h3 className="font-heading text-base font-bold text-white">{k.name}</h3>
                  <p className="text-xs text-[#c9a84c] font-semibold mt-0.5">{k.detail}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-2xl font-extrabold text-white">{k.price}</p>
                  <Link href="/kredi-yukle" className="text-[10px] text-[#c9a84c] font-bold uppercase tracking-wider hover:text-white transition-colors">
                    Satın Al →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info & FAQ Notice */}
        <div className="mt-20 border-t border-white/5 pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#c9a84c]" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-1">Güvenli Altyapı ve Ödemeler</h4>
              <p className="font-body text-xs text-gray-400 leading-relaxed">
                Tüm verileriniz 256-bit SSL şifrelemeyle korunur. Ödemeler şimdilik aylık havale/EFT ile alınır;
                kredi kartı desteği yakında eklenecektir.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-[#c9a84c]" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-1">Sınırsız Arama Özelliği</h4>
              <p className="font-body text-xs text-gray-400 leading-relaxed">
                Avukat paketlerimizde karar arama ve mevzuat incelemeleri kotanızdan düşmez. Sadece AI asistanı sorguları kotayı etkiler.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#c9a84c]" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-1">Sorularınız mı var?</h4>
              <p className="font-body text-xs text-gray-400 leading-relaxed">
                Aklınıza takılan sorular veya kurumsal entegrasyon talepleriniz için bize ulaşın:{" "}
                <a href="mailto:destek@mizanim.com" className="text-[#c9a84c] underline hover:text-white transition-colors">destek@mizanim.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
