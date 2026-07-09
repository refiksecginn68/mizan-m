"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Scale, 
  Search, 
  FileText, 
  MessageSquare, 
  Video, 
  Check, 
  Star, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  FileCheck, 
  Layers, 
  UserCheck, 
  HelpCircle
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";

// Next.js (SSR) uyumluluğu için Isomorphic Layout Effect
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Three.js Canvas'ı SSR hatalarını önlemek için dinamik (ssr: false) yüklenir
const Scene3D = dynamic(() => import("@/components/shared/Scene3D"), { ssr: false });

const FEATURES = [
  {
    icon: Search,
    title: "Semantik Emsal Karar Arama",
    desc: "Yargıtay, Danıştay, AYM ve BAM kararları üzerinde sadece kelime değil, anlam bazlı arama yaparak en kritik emsalleri saniyeler içinde bulun."
  },
  {
    icon: FileText,
    title: "Akıllı Belge ve Evrak Analizi",
    desc: "PDF, Word veya taranmış evrakları yükleyin. Yapay zeka riskli maddeleri, eksiklikleri ve yasal dayanakları sizin için maddelesin."
  },
  {
    icon: FileCheck,
    title: "Kusursuz Dilekçe Üretimi",
    desc: "Dava konusunu ve olay detaylarını girin; AI, Türk Borçlar, Medeni veya İş Kanununa tam atıfta bulunan profesyonel dilekçe şablonları hazırlasın."
  },
  {
    icon: MessageSquare,
    title: "Gelişmiş AI Hukuk Asistanı",
    desc: "Doğal dilde hukuki sorularınızı yöneltin. AI, her cevabı kanun maddesi, fıkra ve karar atıflarıyla birlikte referanslı olarak sunar."
  },
  {
    icon: Layers,
    title: "Büro Yönetim Sistemleri",
    desc: "Müvekkil CRM kartları, dava dosyası yönetimi, finansal kasa, gelir-gider takibi ve akıllı takvim alarmları tek bir ekranda."
  },
  {
    icon: Video,
    title: "Multimedya Delil Analizi",
    desc: "Ses kayıtlarındaki itirafları, video kayıtlarındaki anlık detayları ve ekran görüntülerindeki yazıları analiz edip delil niteliğini raporlayın."
  }
];

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState<"avukat" | "vatandas">("avukat");
  const [mockChatQuery, setMockChatQuery] = useState("");
  const [mockChatHistory, setMockChatHistory] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Merhaba, hukuki sorunuzu yazın. Örneğin: 'Kira artış oranı sınırı nedir?'" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const heroTextRef = useRef<HTMLHeadingElement>(null);
  const heroSubtextRef = useRef<HTMLParagraphElement>(null);
  const heroCtasRef = useRef<HTMLDivElement>(null);
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // GSAP + Lenis Scroll Entegrasyonu
  useIsomorphicLayoutEffect(() => {
    // 1. GSAP ScrollTrigger'ı kaydet
    gsap.registerPlugin(ScrollTrigger);

    // 2. Lenis'i başlat (Pürüzsüz fare/trackpad kaydırması için ayarlar)
    const lenis = new Lenis({
      lerp: 0.08,           // Yumuşaklık düzeyi
      wheelMultiplier: 1,   // Fare tekerleği hassasiyeti
    });

    // 3. Lenis kaydıkça ScrollTrigger'ı güncelle (Senkronizasyon)
    lenis.on("scroll", ScrollTrigger.update);

    // 4. Lenis'in frame güncellemelerini GSAP'in kendi ticker'ına bağla
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0); // Kare atlamalarında GSAP'in sıçramasını engeller

    // Hero Animasyonları
    gsap.fromTo(
      heroTextRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.2 }
    );
    gsap.fromTo(
      heroSubtextRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.4 }
    );
    gsap.fromTo(
      heroCtasRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.6 }
    );

    // Premium Yatay Kayma Animasyonu (ScrollTrigger)
    const cards = gsap.utils.toArray(".scroll-card");
    if (scrollSectionRef.current && scrollContainerRef.current && cards.length > 0) {
      // Toplam yatay kaydırma miktarını hesapla
      const amountToScroll = scrollContainerRef.current.scrollWidth - window.innerWidth + 120;
      
      gsap.to(scrollContainerRef.current, {
        x: -amountToScroll,
        ease: "none",
        scrollTrigger: {
          trigger: scrollSectionRef.current,
          pin: true,
          scrub: 1.2,
          start: "top top",
          end: () => `+=${amountToScroll}`,
          invalidateOnRefresh: true,
        }
      });
    }

    // 5. Temizlik (Lenis ve ScrollTrigger temizliği)
    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const handleMockChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockChatQuery.trim() || isTyping) return;

    const userText = mockChatQuery;
    setMockChatHistory(prev => [...prev, { role: "user", text: userText }]);
    setMockChatQuery("");
    setIsTyping(true);

    // Mock AI cevabı
    setTimeout(() => {
      let aiResponse = "Hukuki sorgunuz analiz ediliyor...";
      if (userText.toLowerCase().includes("kira")) {
        aiResponse = "Türk Borçlar Kanunu geçici maddesi uyarınca, konut kiralarında kira artış oranı sınırı %25 olarak uygulanmaktaydı. Ancak Temmuz 2024 itibarıyla bu sınırlama kalkmış olup, kira artış oranları tekrar TÜFE 12 aylık ortalamasına göre belirlenmektedir.";
      } else if (userText.toLowerCase().includes("dilekçe")) {
        aiResponse = "Mizanım AI ile dilekçe hazırlamak çok kolay. Soldaki menüden 'Dilekçe İşlemleri' sekmesine girerek dilediğiniz dava türünde (Kira tahliye, İş tazminatı, İtiraz) UYAP uyumlu dilekçe üretebilirsiniz.";
      } else {
        aiResponse = "Hukuki sorunuz için güncel mevzuat ve emsal kararlar taranmıştır. İlgili hususlarda hak kaybına uğramamak adına uzman bir avukattan profesyonel destek almanız tavsiye edilir.";
      }
      setMockChatHistory(prev => [...prev, { role: "ai", text: aiResponse }]);
      setIsTyping(false);
    }, 1200);
  };

  const pricingPlans = [
    {
      name: "Vatandaş",
      tagline: "Hukuki rehberlik herkes için",
      price: "49₺",
      period: "tek_seferlik",
      credits: "50 kredi",
      features: [
        "Kayıtta 20 kredi hediye",
        "AI hukuk asistanı",
        "Belge analizi",
        "Dilekçe üretimi",
        "Emsal arama",
      ],
      buttonText: "Ücretsiz Başla",
      buttonHref: "/kayit?tip=vatandas",
      accent: false,
    },
    {
      name: "Avukat Pro",
      tagline: "Profesyonel hukuk pratiği için",
      price: billingCycle === "monthly" ? "1.499₺" : "1.199₺",
      period: "ay",
      credits: "1.000 AI sorgu/ay",
      features: [
        "1.000 AI sorgu/ay",
        "Tüm AI özellikleri (sohbet, AI özet, belge analizi, dilekçe)",
        "Sınırsız emsal + mevzuat arama",
        "CRM müvekkil yönetimi",
        "Dava dosya takibi",
        "Akıllı takvim & alarm",
        "Finans takibi",
      ],
      buttonText: "14 Gün Ücretsiz Dene",
      buttonHref: "/kayit?tip=avukat&plan=profesyonel",
      accent: false,
    },
    {
      name: "Avukat Max",
      tagline: "Tam donanımlı profesyonel",
      price: billingCycle === "monthly" ? "2.999₺" : "2.399₺",
      period: "ay",
      credits: "3.000 AI sorgu/ay",
      features: [
        "Avukat Pro'nun tümü",
        "3.000 AI sorgu/ay",
        "UYAP entegrasyonu & duruşma sorgulama",
        "UETS e-tebligat entegrasyonu",
        "Öncelikli işlemci & hız",
      ],
      buttonText: "14 Gün Ücretsiz Dene",
      buttonHref: "/kayit?tip=avukat&plan=buro",
      accent: true,
    },
    {
      name: "Büro Planı",
      tagline: "Hukuk büroları için tam paket",
      price: "İletişime Geç",
      period: "ozel",
      credits: "Sınırsız / Esnek",
      features: [
        "Avukat Max'in tümü",
        "Çoklu kullanıcı (5 hesaba kadar)",
        "Ortak çalışma alanı",
        "Sınırsız / Esnek sorgu kotası",
        "Kurumsal onboarding & eğitim",
        "Özel SLA & öncelikli destek",
        "Emsal içtihat veri tabanı entegrasyonu",
        "Raporlama & performans paneli",
      ],
      buttonText: "İletişime Geç",
      buttonHref: "/iletisim",
      accent: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1729] text-white overflow-x-hidden selection:bg-[#c9a84c] selection:text-white relative">
      
      {/* Dynamic 3D Scene in background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Scene3D />
      </div>

      {/* Top Navigation */}
      <header className="relative z-50 border-b border-white/5 bg-[#0f1729]/75 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e5c060] flex items-center justify-center transition-transform group-hover:scale-105">
              <Scale className="w-5 h-5 text-[#0f1729]" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-white">Mizanım</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#ozellikler" className="text-sm text-gray-400 hover:text-white transition-colors">Özellikler</Link>
            <Link href="#kimin-icin" className="text-sm text-gray-400 hover:text-white transition-colors">Kimin İçin?</Link>
            <Link href="#demo" className="text-sm text-gray-400 hover:text-white transition-colors">AI Demo</Link>
            <Link href="#fiyatlandirma" className="text-sm text-gray-400 hover:text-white transition-colors">Fiyatlandırma</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/giris" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-2">Giriş Yap</Link>
            <Link
              href="/kayit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#e5c060] hover:from-[#b08f3b] hover:to-[#c9a84c] text-[#0f1729] text-xs font-bold transition-all duration-300 shadow-[0_0_25px_rgba(201,168,76,0.2)] hover:shadow-[0_0_35px_rgba(201,168,76,0.35)]"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-10 pb-20 md:pt-20 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text content */}
          <div className="lg:col-span-7 space-y-8 text-left relative">
            <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-[#c9a84c]/5 blur-3xl pointer-events-none" />
            
            <div className="inline-flex items-center gap-2 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-full px-4.5 py-2 text-[#c9a84c] text-xs font-semibold">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Hukuk Teknolojisinde Yapay Zeka Devrimi</span>
            </div>
            
            <h1 
              ref={heroTextRef}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight opacity-0"
            >
              Adaletin Yapay Zeka Boyutu: <br />
              <span className="text-[#c9a84c] bg-gradient-to-r from-[#c9a84c] via-[#f2d583] to-[#c9a84c] bg-clip-text text-transparent">
                Hukuk Dünyasında Dijital Mizan
              </span>
            </h1>
            
            <p 
              ref={heroSubtextRef}
              className="font-body text-gray-300 text-lg sm:text-xl leading-relaxed max-w-2xl opacity-0"
            >
              Türkiye’nin en gelişmiş yapay zeka hukuk asistanı. Avukatlar ve hukuk büroları için tam donanımlı otomasyon, vatandaşlar için anlaşılır ve güvenilir hukuki rehberlik.
            </p>

            {/* Three CTA Buttons (Avukat Portal Girişi, Avukat Girişi, Vatandaş Girişi) */}
            <div 
              ref={heroCtasRef}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 opacity-0"
            >
              <Link
                href="/giris?role=avukat"
                className="group flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-[#c9a84c] text-[#0f1729] font-bold text-xs text-center transition-all duration-300 hover:bg-[#b08f3b] flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(201,168,76,0.25)]"
              >
                <span>Avukat Portal Girişi</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/giris?role=avukat"
                className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-transparent border-2 border-[#c9a84c]/40 hover:border-[#c9a84c] text-[#c9a84c] font-bold text-xs text-center transition-all duration-300 flex items-center justify-center"
              >
                Avukat Girişi
              </Link>

              <Link
                href="/giris?role=vatandas"
                className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs text-center transition-all duration-300 border border-white/5 flex items-center justify-center gap-1.5"
              >
                <span>Vatandaş Girişi</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/40" />
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/5">
              {[
                { val: "14K+", label: "Güncel Mevzuat" },
                { val: "2M+", label: "Emsal Karar" },
                { val: "3 sn", label: "Yanıt Süresi" },
                { val: "%99.9", label: "Kaynak Doğruluğu" }
              ].map((st, i) => (
                <div key={i}>
                  <p className="font-heading text-2xl font-bold text-white">{st.val}</p>
                  <p className="text-xs text-gray-500 mt-1">{st.label}</p>
                </div>
              ))}
            </div>

          </div>

          {/* Right Preview - Interactive AI Chat Widget */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-[#c9a84c]/5 rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative rounded-3xl border border-white/5 bg-[#1e293b]/50 backdrop-blur-md overflow-hidden shadow-2xl">
              
              {/* Window Header */}
              <div className="bg-[#0f1729]/90 px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#c9a84c] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mizanım AI Asistan</span>
                </div>
              </div>

              {/* Chat Body */}
              <div className="h-[280px] overflow-y-auto p-5 space-y-4 font-body text-xs leading-relaxed">
                {mockChatHistory.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === "user" 
                          ? "bg-[#c9a84c] text-[#0f1729] font-medium" 
                          : "bg-white/5 border border-white/5 text-gray-200"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-bounce delay-200" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-bounce delay-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleMockChatSubmit} className="p-4 border-t border-white/5 bg-[#0f1729]/40 flex gap-2">
                <input
                  type="text"
                  placeholder="Denemek için soru sorun (örn: kira)..."
                  value={mockChatQuery}
                  onChange={(e) => setMockChatQuery(e.target.value)}
                  className="flex-1 rounded-xl bg-white/5 border border-white/5 text-xs px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50 text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="px-4 bg-[#c9a84c] hover:bg-[#b08f3b] text-[#0f1729] font-bold text-xs rounded-xl transition-all flex items-center justify-center"
                >
                  Gönder
                </button>
              </form>

            </div>
          </div>

        </div>
      </section>

      {/* Özellikler Bölümü (Yatay Pinned Kaydırma) */}
      <section 
        id="ozellikler" 
        ref={scrollSectionRef} 
        className="relative z-20 bg-[#0a0f1d] min-h-screen flex flex-col justify-center border-t border-white/5 overflow-hidden py-16 md:py-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-12">
          <div className="inline-flex items-center gap-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-full px-4.5 py-2 mb-4 text-[#c9a84c] text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Platform Yetenekleri</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Hukukun Dijital Mizanı: Yetenekleri Keşfedin
          </h2>
          <p className="font-body text-gray-400 text-sm sm:text-base max-w-2xl mt-3">
            Türk hukuk sistemine özel tasarlanmış modüller. Aşağı kaydırdıkça yatay olarak akan özellikleri inceleyin.
          </p>
        </div>

        {/* Yatay Kayar Kartlar */}
        <div className="w-full flex items-center overflow-hidden">
          <div 
            ref={scrollContainerRef} 
            className="flex flex-row gap-6 px-4 sm:px-6 lg:px-8 pb-10" 
            style={{ width: "fit-content" }}
          >
            {FEATURES.map((ft, idx) => {
              const IconComp = ft.icon;
              return (
                <div 
                  key={idx} 
                  className="scroll-card w-[290px] sm:w-[380px] flex-shrink-0 bg-gradient-to-b from-[#1e293b]/70 to-[#0f1729]/70 border border-white/5 rounded-3xl p-6 sm:p-8 hover:border-[#c9a84c]/30 transition-all duration-300 relative overflow-hidden group shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a84c]/5 rounded-full -translate-y-4 translate-x-4 blur-xl pointer-events-none group-hover:bg-[#c9a84c]/10 transition-all duration-300" />
                  <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
                    <IconComp className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white mb-3">{ft.title}</h3>
                  <p className="font-body text-xs sm:text-sm text-gray-400 leading-relaxed">{ft.desc}</p>
                  
                  {/* Card Index decoration */}
                  <span className="absolute bottom-4 right-6 text-7xl font-extrabold text-white/5 select-none pointer-events-none font-heading">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Target Audience Tabs Section */}
      <section id="kimin-icin" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">Kimin İçin Tasarladık?</h2>
          <p className="font-body text-gray-400 text-sm">
            İhtiyacınıza göre şekillenen iki ayrı dünya. Rolünüzü seçin ve platformun sunduğu özellikleri inceleyin.
          </p>

          {/* Tab buttons */}
          <div className="flex items-center justify-center gap-3 mt-8 bg-white/5 border border-white/5 rounded-2xl p-1.5 max-w-xs mx-auto">
            <button
              onClick={() => setActiveTab("avukat")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "avukat" ? "bg-[#c9a84c] text-[#0f1729]" : "text-gray-400 hover:text-white"
              }`}
            >
              Hukukçu & Avukat
            </button>
            <button
              onClick={() => setActiveTab("vatandas")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "vatandas" ? "bg-[#c9a84c] text-[#0f1729]" : "text-gray-400 hover:text-white"
              }`}
            >
              Bireysel & Birey
            </button>
          </div>
        </div>

        {/* Tab contents */}
        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === "avukat" ? (
              <motion.div
                key="avukat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white/5 border border-white/5 rounded-3xl p-8"
              >
                <div className="space-y-6">
                  <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-[#c9a84c]" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-white">Avukat ve Hukuk Büroları İçin</h3>
                  <p className="font-body text-gray-400 text-sm leading-relaxed">
                    Dosya yoğunluğunu azaltın, rutin işleri yapay zekaya devredin. Müvekkillerinizin taleplerine hızlı dönüş sağlarken, UYAP, UETS ve takvim entegrasyonuyla tüm büronuzu tek noktadan yönetin.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
                    {[
                      "1.000 veya 3.000 AI Sorgu Kotası",
                      "Sınırsız / Bedava Karar Arama",
                      "UDF & PDF Dilekçe Formatı",
                      "Gelişmiş Dava CRM Yönetimi",
                      "UETS Tebligat Alarm Sistemi",
                      "UYAP Duruşma & Gün Senkronizasyonu"
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <Link
                      href="/kayit?tip=avukat"
                      className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#c9a84c] text-[#0f1729] text-xs font-bold hover:bg-[#b08f3b] transition-all"
                    >
                      14 Gün Ücretsiz Başlat <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-[#0f1729] p-6 shadow-lg">
                  {/* Dashboard Mockup in dark theme */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <p className="text-[11px] font-bold text-white">Büro Paneli / Dava Dosyaları</p>
                      <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">UYAP Aktif</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white/5 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-white">Esas 2026 / 482 - Asliye Hukuk</p>
                          <p className="text-[10px] text-gray-400">Duruşma: Yarın 10:30 (İstanbul Adliyesi)</p>
                        </div>
                        <span className="text-[10px] text-[#c9a84c] font-semibold">1 gün kaldı</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-white">Esas 2025 / 1102 - İş Mahkemesi</p>
                          <p className="text-[10px] text-gray-400">Son İşlem: Dilekçe teslim edildi</p>
                        </div>
                        <span className="text-[10px] text-gray-400">Tamamlandı</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="vatandas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white/5 border border-white/5 rounded-3xl p-8"
              >
                <div className="space-y-6">
                  <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-[#c9a84c]" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-white">Vatandaş ve Bireysel Kullanıcılar İçin</h3>
                  <p className="font-body text-gray-400 text-sm leading-relaxed">
                    Hukuk dilini anlamakta zorlanıyor musunuz? Sözleşmelerinizi analiz ettirin, haklarınızı öğrenin, adliyeye gitmeden önce dilekçenizi hazırlayın. Mizanım AI, hukuki haklarınızı bilmeniz için yanınızda.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
                    {[
                      "Kayıtta 20 Hediye Kredi",
                      "Sade Hukuki Soru Asistanı",
                      "Basit Kira / Tahliye Hesaplama",
                      "Tüketici Şikayeti Dilekçesi",
                      "Kişisel Sözleşme İnceleme",
                      "Kolay Anlaşılır Hukuk Sözlüğü"
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <Link
                      href="/kayit?tip=vatandas"
                      className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#c9a84c] text-[#0f1729] text-xs font-bold hover:bg-[#b08f3b] transition-all"
                    >
                      Hemen Ücretsiz Başla <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-[#0f1729] p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <p className="text-[11px] font-bold text-white">Vatandaş Paneli / AI Belge Özeti</p>
                      <span className="text-[9px] bg-[#c9a84c]/10 text-[#c9a84c] px-2 py-0.5 rounded-full font-bold">5 kredi harcandı</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                      <p className="text-[11px] font-bold text-white">Yüklenen Kira Sözleşmesi Analizi:</p>
                      <p className="text-[10px] text-gray-300 leading-normal">
                        1. 5. madde uyarınca kiracı aleyhine tek taraflı cezai şart konulmuştur (Geçersizlik riski). <br />
                        2. Depozito miktarı yasal limit olan 3 aylık kira sınırına uygundur. <br />
                        3. Tahliye taahhütnamesi sözleşmeyle aynı gün imzalanmış görünüyor (Yargıtay kararlarına göre geçersizdir).
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </section>

      {/* Pricing Section (4 Cards Grid with Toggle) */}
      <section id="fiyatlandirma" className="relative z-10 py-20 border-t border-white/5 bg-[#080d1a]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">Bütçenize Uygun Paketler</h2>
            <p className="font-body text-gray-400 text-sm">
              Gizli ücretler yok. İhtiyacınıza göre seçin ve aboneliğinizi dilediğiniz an iptal edin.
            </p>

            {/* Toggle Monthly / Yearly */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-xs ${billingCycle === "monthly" ? "text-white font-semibold" : "text-gray-400"}`}>Aylık Faturalama</span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative w-11 h-6 bg-white/10 rounded-full p-1 transition-all duration-300 focus:outline-none"
              >
                <div
                  className={`w-4 h-4 bg-[#c9a84c] rounded-full transition-all duration-300 ${
                    billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-[#c9a84c] font-semibold" : "text-gray-400"}`}>
                Yıllık Faturalama
                <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                  %20 İndirim
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 ${
                  plan.accent
                    ? "bg-gradient-to-b from-[#1a2744] to-[#0f1729] border-2 border-[#c9a84c] shadow-[0_0_30px_rgba(201,168,76,0.08)] scale-105 z-10"
                    : "bg-white/5 border border-white/5 hover:border-white/10"
                }`}
              >
                {plan.accent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-[#c9a84c] text-[#0f1729] text-[9px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow">
                      <Star className="w-3 h-3 fill-current" />
                      En Popüler
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-heading text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px]">{plan.tagline}</p>
                </div>

                <div className="mb-6 flex flex-col justify-end">
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-3xl font-extrabold text-white">
                      {plan.price}
                    </span>
                    {plan.period === "ay" && (
                      <span className="text-xs text-gray-400 font-medium">/ ay</span>
                    )}
                    {plan.period === "tek_seferlik" && (
                      <span className="text-xs text-[#c9a84c] font-semibold bg-[#c9a84c]/10 border border-[#c9a84c]/20 px-2 py-0.5 rounded ml-2">
                        {plan.credits}
                      </span>
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
                  {plan.period === "tek_seferlik" && (
                    <p className="text-[10px] text-[#c9a84c] mt-1 font-medium">
                      Ek krediler sonradan alınabilir
                    </p>
                  )}
                  {plan.period === "ozel" && (
                    <p className="text-[10px] text-gray-500 mt-1 font-medium">
                      Sınırsız sorgu ve özel sunucu
                    </p>
                  )}
                </div>

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

                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-3">Paket Özellikleri</p>
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

          <div className="mt-8 text-center text-xs text-gray-500">
            * Yıllık ödemelerde liste fiyatları üzerinden %20 indirim uygulanmıştır. Fiyatlarımıza KDV dahildir.
          </div>

        </div>
      </section>

      {/* FAQ / SSS */}
      <section className="relative z-10 py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight mb-2">Sıkça Sorulan Sorular</h2>
          <p className="font-body text-sm text-gray-400">Merak ettiğiniz hususları sizin için derledik.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Kota mantığı nasıl çalışır? Hangi işlemler kotamdan düşer?",
              a: "Ham karar ve mevzuat aramaları kotanızdan DÜŞMEZ. Sınırsız ve ücretsizdir. Sadece LLM (Yapay Zeka) kullanan işlemler (MizanAI asistan sohbet mesajı gönderme, evrak analizi talep etme, dilekçe üretme veya delil değerlendirme) kotanızdan 1 harcama eksiltir."
            },
            {
              q: "Aylık kotam biterse sistem devre dışı mı kalır?",
              a: "Hayır. Kotanız bittiğinde panelden Ek Sorgu Paketleri (Kontör) satın alarak işlem yapmaya kesintisiz devam edebilirsiniz. Kontörler aktif aboneliğiniz sürdüğü sürece devrederek kullanılabilir."
            },
            {
              q: "Vatandaş paketindeki krediler nerede geçerlidir?",
              a: "Vatandaş kullanıcılar kredi sistemine tabidir. Her dilekçe üretimi 8 kredi, belge analizi 5 kredi, basit sorular ise 1 kredi değerindedir. Paketinizdeki 50 kredi ile dilediğiniz şekilde işlem yapabilirsiniz."
            },
            {
              q: "UYAP ve e-tebligat entegrasyonu güvenli mi?",
              a: "Evet, tüm UYAP ve e-imza bağlantıları yerel şifrelenmiş tüneller ve TLS 1.3 güvenlik protokolleri üzerinden çalışır. Şifreniz veya e-imza pin kodunuz hiçbir şekilde sunucularımızda saklanmaz."
            }
          ].map((faq, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex gap-3">
                <HelpCircle className="w-5 h-5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading text-sm font-bold text-white mb-2">{faq.q}</h4>
                  <p className="font-body text-xs text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#080d1a] py-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex justify-center gap-6 text-gray-400 mb-4">
            <Link href="#ozellikler" className="hover:text-white transition-colors">Özellikler</Link>
            <Link href="#fiyatlandirma" className="hover:text-white transition-colors">Fiyatlandırma</Link>
            <Link href="/fiyatlandirma" className="hover:text-white transition-colors">Fiyat Kartları</Link>
            <Link href="mailto:destek@mizanim.com" className="hover:text-white transition-colors">İletişim</Link>
          </div>
          <p>© 2026 Mizanım AI Hukuk Teknolojileri. Tüm hakları saklıdır. Bu platform hukuki tavsiye sunmaz.</p>
        </div>
      </footer>

    </div>
  );
}
