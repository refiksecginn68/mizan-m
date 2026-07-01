import Link from "next/link";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import AuthRedirect from "@/components/shared/AuthRedirect";
import {
  Scale,
  Search,
  FileText,
  BookOpen,
  MessageSquare,
  Video,
  Briefcase,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Zap,
} from "lucide-react";

const skills = [
  {
    icon: Search,
    title: "Emsal Karar Arama",
    description:
      "Yargıtay, Danıştay, AYM ve BAM kararlarında semantik arama yapın. İlgili içtihatları saniyeler içinde bulun.",
  },
  {
    icon: BookOpen,
    title: "Mevzuat Arama",
    description:
      "14.000+ mevzuat arasında güncel kanun, yönetmelik ve maddelere anında ulaşın.",
  },
  {
    icon: FileText,
    title: "Belge Analizi",
    description:
      "PDF sözleşme, mahkeme kararı veya belgelerinizi yükleyin — AI riskler ve önemli noktaları çıkarsın.",
  },
  {
    icon: Scale,
    title: "Belge Üretimi",
    description:
      "Dilekçe, ihtarname, savunma ve sözleşme taslakları oluşturun. UYAP uyumlu UDF formatında indirin.",
  },
  {
    icon: MessageSquare,
    title: "Hukuki Soru-Cevap",
    description:
      "Doğal dilde sorun, kanun maddesi ve emsal kaynaklı yanıt alın. Her yanıtta kaynak zorunlu.",
  },
  {
    icon: Video,
    title: "Delil & Medya Analizi",
    description:
      "Ses kaydı, görüntü, video ve ekran görüntülerini AI ile analiz edin. Delil değerlendirmesi.",
  },
];

const avukatFeatures = [
  "CRM / Müvekkil yönetimi",
  "Dava dosya takibi ve AI analizi",
  "UYAP entegrasyonu (UDF, e-imza)",
  "UETS e-tebligat takibi",
  "Akıllı takvim & duruşma alarmları",
  "Finans & tahsilat takibi",
];

const vatandasFeatures = [
  "Sade ve anlaşılır AI asistan",
  "Belge ve sözleşme analizi",
  "Dilekçe ve ihtarname üretimi",
  "Emsal karar araştırma",
  "Kişisel dosya arşivi",
  "Avukata yönlendirme rehberi",
];

const stats = [
  { value: "14.000+", label: "Mevzuat" },
  { value: "2M+", label: "Emsal Karar" },
  { value: "<3 sn", label: "Yanıt Süresi" },
  { value: "%99.9", label: "Kaynak Doğruluğu" },
];

const pricingPlans = [
  {
    type: "vatandas",
    name: "Vatandaş",
    tagline: "Hukuki rehberlik herkes için",
    price: "49₺",
    unit: "50 kredi",
    highlight: false,
    features: [
      "Kayıtta 20 kredi hediye",
      "AI hukuk asistanı",
      "Belge analizi",
      "Dilekçe üretimi",
      "Emsal arama",
    ],
    cta: "Ücretsiz Başla",
    href: "/kayit?tip=vatandas",
  },
  {
    type: "avukat-pro",
    name: "Avukat Profesyonel",
    tagline: "Profesyonel hukuk pratiği için",
    price: "1.299₺",
    unit: "/ay",
    highlight: true,
    features: [
      "Tüm AI özellikleri",
      "CRM müvekkil yönetimi",
      "Dava dosya takibi",
      "Akıllı takvim & alarm",
      "Finans takibi",
    ],
    cta: "14 Gün Ücretsiz Dene",
    href: "/kayit?tip=avukat&plan=profesyonel",
  },
  {
    type: "avukat-buro",
    name: "Büro Planı",
    tagline: "Hukuk büroları için tam paket",
    price: "2.999₺",
    unit: "/ay",
    highlight: false,
    features: [
      "Profesyonel planın tümü",
      "UYAP entegrasyonu",
      "UETS e-tebligat takibi",
      "Çoklu kullanıcı desteği",
      "Öncelikli destek",
    ],
    cta: "Büroyu Kur",
    href: "/kayit?tip=avukat&plan=buro",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <AuthRedirect />
      <Header />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="gradient-primary min-h-[92vh] flex items-center relative">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
            <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-white/3 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-accent/30 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-accent" />
              <span className="font-body text-sm text-white/90">
                Türkiye&apos;nin İlk Çift Kapılı AI Hukuk Platformu
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
              Hukukta
              <span className="text-accent"> Yapay Zeka</span>
              <br />
              Çağına Hoşgeldiniz
            </h1>

            <p className="font-body text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
              Emsal arama, belge analizi, dilekçe üretimi ve UYAP entegrasyonu
              — avukatlar ve vatandaşlar için tek platformda.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link href="/kayit?tip=vatandas" className="btn-accent text-base px-8 py-4">
                Vatandaş Olarak Başla
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <Link
                href="/kayit?tip=avukat"
                className="btn-outline border-white text-white hover:bg-white hover:text-primary text-base px-8 py-4"
              >
                Avukat Portalı
                <Briefcase className="w-5 h-5 ml-2 inline" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              {[
                { icon: Shield, text: "KVKK Uyumlu" },
                { icon: CheckCircle, text: "Kaynaklı Yanıtlar" },
                { icon: Star, text: "Güncel Mevzuat" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/60">
                  <Icon className="w-4 h-4 text-accent" />
                  <span className="font-body text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-accent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center py-2">
                  <div className="font-heading text-2xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="font-body text-xs text-primary/70 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Çift Kapı Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">İki Kullanıcı, Bir Platform</h2>
            <p className="section-subtitle">
              Avukatlar ve vatandaşlar için ayrı deneyim, ortak AI beyni
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Avukat Kapısı */}
            <div className="card border-l-4 border-l-primary hover:shadow-elevated transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-primary">
                    Avukat Portalı
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Profesyonel, teknik, verimlilik odaklı
                  </p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {avukatFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="font-body text-sm text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/kayit?tip=avukat"
                className="btn-primary w-full text-center block"
              >
                Avukat Olarak Kaydol
              </Link>
            </div>

            {/* Vatandaş Kapısı */}
            <div className="card border-l-4 border-l-accent hover:shadow-elevated transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-primary">
                    Vatandaş Portalı
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Sade, anlaşılır, güven veren
                  </p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {vatandasFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="font-body text-sm text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/kayit?tip=vatandas"
                className="btn-accent w-full text-center block"
              >
                Vatandaş Olarak Kaydol
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Skills Section */}
      <section id="ozellikler" className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Ortak AI Skill Havuzu</h2>
            <p className="section-subtitle">
              Her iki portal da aynı güçlü AI altyapısını kullanır
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => {
              const Icon = skill.icon;
              return (
                <div
                  key={skill.title}
                  className="card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-gold transition-all">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary mb-2">
                    {skill.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {skill.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="nasil-calisir" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Nasıl Çalışır?</h2>
            <p className="section-subtitle">
              3 adımda hukuki süreci başlatın
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Kayıt Olun",
                description:
                  "Avukat veya vatandaş olarak kayıt olun. Vatandaşlara 20 kredi hediye.",
              },
              {
                step: "02",
                title: "Sorunuzu Sorun",
                description:
                  "Türkçe olarak sorun veya belgenizi yükleyin. AI anında işleme koyulur.",
              },
              {
                step: "03",
                title: "Kaynaklı Yanıt Alın",
                description:
                  "Her yanıtta kanun maddesi, karar no ve tarih referansı bulunur.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-accent font-heading text-2xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading text-xl font-bold text-primary mb-3">
                  {item.title}
                </h3>
                <p className="font-body text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="fiyatlandirma" className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Şeffaf Fiyatlandırma</h2>
            <p className="section-subtitle">
              İhtiyacınıza göre plan seçin, istediğiniz zaman iptal edin
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.type}
                className={`card relative hover:shadow-elevated transition-all duration-300 ${
                  plan.highlight
                    ? "border-2 border-accent shadow-gold scale-105"
                    : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="gradient-gold text-white text-xs font-body font-bold px-4 py-1 rounded-full">
                      En Popüler
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-heading text-xl font-bold text-primary">
                    {plan.name}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {plan.tagline}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="font-body text-sm text-muted-foreground ml-1">
                    {plan.unit}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="font-body text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center w-full py-3 rounded-lg font-body font-semibold transition-all ${
                    plan.highlight ? "btn-accent" : "btn-outline"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center font-body text-sm text-muted-foreground mt-8">
            Tüm planlar KDV dahildir. Avukat planları yıllık ödemede %20 indirimlidir.
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Hukuki Sürecinizi Bugün Başlatın
          </h2>
          <p className="font-body text-white/70 mb-8 text-lg">
            Kayıt ücretsiz. Vatandaşlara 20 kredi hediye. Avukatlara 14 gün deneme.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kayit" className="btn-accent text-base px-8 py-4">
              Hemen Kaydol — Ücretsiz
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
