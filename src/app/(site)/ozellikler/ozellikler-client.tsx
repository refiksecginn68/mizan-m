"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, SearchCheck, FilePen, FileSearch, Users, CalendarClock, Landmark, MailCheck,
  MessageCircleQuestion, FileWarning, Scale, FileText, Briefcase, User,
} from "lucide-react";
import SectionHeading from "@/components/landing/section-heading";
import CtaBand from "@/components/landing/cta-band";
import KvkkModal from "@/components/landing/kvkk-modal";

type Tab = "avukat" | "vatandas";

interface DetailFeature {
  icon: typeof Bot;
  title: string;
  description: string;
  bullets: string[];
  badge?: string;
}

const AVUKAT_DETAILS: DetailFeature[] = [
  {
    icon: Bot,
    title: "MizanAI Hukuk Asistanı",
    description: "Dava bağlamını bilen yapay zekâ sohbeti. Dosyanızı, müvekkilinizi ve finans kayıtlarınızı tanır; genel geçer değil, davanıza özel yanıt verir.",
    bullets: ["Dava dosyası bağlamı otomatik yüklenir", "Emsal ve mevzuat dayanağıyla yanıt", "Sohbet geçmişi dosyaya bağlı saklanır"],
  },
  {
    icon: SearchCheck,
    title: "Emsal & Mevzuat Arama",
    description: "Yargıtay, Danıştay, BAM ve ilk derece kararlarında anlam temelli arama. Kotanızdan düşmez, sınırsız kullanın.",
    bullets: ["Milyonlarca karar, saniyeler içinde", "Esas/karar numarasıyla kesin eşleşme", "Akıllı sıralama ve alaka puanı"],
  },
  {
    icon: FilePen,
    title: "Dilekçe Üretimi",
    description: "Dava türüne uygun, kurumsal formatta dilekçe taslağı. Zengin editörle düzenleyin, favorilerinize kaydedin.",
    bullets: ["Tek tıkla taslak", "Kurumsal dilekçe iskeleti", "Şablon kütüphanesi ve favoriler"],
  },
  {
    icon: FileSearch,
    title: "Belge Analizi",
    description: "PDF veya DOCX yükleyin; özet, taraflar, kritik tarihler ve risk noktaları dakikalar içinde önünüzde.",
    bullets: ["Sözleşme risk analizi", "Karar ve bilirkişi raporu özeti", "Kritik madde işaretleme"],
  },
  {
    icon: Users,
    title: "CRM & Müvekkil Yönetimi",
    description: "Müvekkil kartları, iletişim geçmişi, vekalet ücreti takibi ve tahsilat durumu tek panelde.",
    bullets: ["Müvekkil ve dosya ilişkilendirme", "Taksit ve tahsilat takibi", "Yaklaşan ödeme hatırlatmaları"],
  },
  {
    icon: CalendarClock,
    title: "Dava Takibi + Akıllı Takvim",
    description: "Duruşma, süre ve görevleriniz aciliyet seviyeleriyle renklendirilir; hatırlatıcılar zamanında uyarır.",
    bullets: ["Aciliyet seviyeli etkinlikler", "1 saat / 1 gün / 3 gün kala hatırlatıcı", "Google Takvim senkronizasyonu"],
  },
  {
    icon: Landmark,
    title: "UYAP Entegrasyonu",
    description: "Chrome eklentisiyle, sizin açtığınız UYAP oturumundaki dosya listesini tek tıkla Mizanım'a aktarın.",
    bullets: ["Otomatik giriş yapmaz, PIN'e erişmez", "Dosyalar CRM ile eşleşir", "Chrome Web Store'da yayında"],
    badge: "Max",
  },
  {
    icon: MailCheck,
    title: "UETS E-Tebligat Takibi",
    description: "E-tebligatlarınızı aynı eklentiyle aktarın; tebligatlar ilgili dosyayla otomatik eşleşsin, süreler takvime düşsün.",
    bullets: ["Tebligat-dosya eşleştirme", "Süre hesabı için tarih yakalama", "Tek eklenti, iki sistem"],
    badge: "Max",
  },
];

const VATANDAS_DETAILS: DetailFeature[] = [
  {
    icon: MessageCircleQuestion,
    title: "Hukuki Soru-Cevap",
    description: "Durumunuzu kendi cümlelerinizle anlatın; hukuki karşılığını anlaşılır bir dille, dayanağıyla birlikte öğrenin.",
    bullets: ["Sade dil, hukuk jargonu yok", "İlgili kanun maddeleri belirtilir", "7/24 erişim"],
  },
  {
    icon: FileWarning,
    title: "Belge Analizi",
    description: "Kira sözleşmesi, iş sözleşmesi, ihtarname... Yükleyin; riskleri, hak ve yükümlülüklerinizi görün.",
    bullets: ["Riskli maddeler işaretlenir", "Anlaşılır özet", "Ne yapmalıyım önerileri"],
  },
  {
    icon: Scale,
    title: "Emsal Arama",
    description: "Sizinkine benzer davalarda mahkemeler ne karar vermiş? Gerçek kararlardan yola çıkarak durumunuzu değerlendirin.",
    bullets: ["Benzer dava kararları", "Anlam temelli eşleştirme", "Karar özetleri"],
  },
  {
    icon: FileText,
    title: "Dilekçe Taslağı",
    description: "İtiraz, şikâyet, talep... İhtiyacınıza uygun dilekçe taslağını dakikalar içinde hazırlayın, indirin.",
    bullets: ["Adım adım yönlendirme", "Resmî format", "Düzenlenebilir çıktı"],
  },
];

const TABS: { key: Tab; label: string; icon: typeof Briefcase }[] = [
  { key: "avukat", label: "Avukat Portalı", icon: Briefcase },
  { key: "vatandas", label: "Vatandaş Paneli", icon: User },
];

// Özellikler sayfası gövdesi: Avukat / Vatandaş sekmeleri + detay kartları
export default function OzelliklerClient() {
  const [tab, setTab] = useState<Tab>("avukat");
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const features = tab === "avukat" ? AVUKAT_DETAILS : VATANDAS_DETAILS;

  return (
    <>
      {/* Sayfa başlığı */}
      <section className="bg-navy-950 pt-32 md:pt-40 pb-14">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading
            eyebrow="Özellikler"
            title="Hukuk pratiğinin tamamı, tek platformda"
            description="Hangi taraftaysanız oradan başlayın — araçların tamamı işinize göre tasarlandı."
          />

          {/* Sekmeler */}
          <div role="tablist" aria-label="Portal seçimi" className="flex justify-center gap-2 mt-10">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${t.key}`}
                  id={`tab-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-md font-inter text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500 ${
                    active
                      ? "bg-gold-500 text-navy-950"
                      : "border border-navy-700 text-cream/70 hover:border-gold-500/50 hover:text-cream"
                  }`}
                >
                  <t.icon aria-hidden className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detay kartları */}
      <section className="bg-navy-900 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <AnimatePresence mode="wait">
            <motion.ul
              key={tab}
              id={`panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              className="grid md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {features.map((f) => (
                <li
                  key={f.title}
                  className="relative bg-navy-800 border border-navy-700 rounded-xl p-7 hover:border-gold-500/40 transition-colors"
                >
                  {f.badge && (
                    <span className="absolute top-5 right-5 px-2 py-0.5 rounded-full text-[10px] font-inter font-semibold uppercase tracking-wider text-gold-300 border border-gold-500/40">
                      {f.badge} planında
                    </span>
                  )}
                  <f.icon aria-hidden className="w-7 h-7 text-gold-500 mb-4" />
                  <h3 className="font-heading text-xl font-bold text-cream mb-2">{f.title}</h3>
                  <p className="font-inter text-sm text-cream/60 leading-[1.7] mb-4">{f.description}</p>
                  <ul className="space-y-2">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 font-inter text-sm text-cream/50">
                        <span aria-hidden className="w-1 h-1 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>

          <p className="font-inter text-sm text-cream/50 text-center mt-12">
            Planları karşılaştırmak için{" "}
            <Link href="/fiyatlandirma" className="text-gold-300 hover:text-gold-100 underline underline-offset-2">
              fiyatlandırma sayfasına
            </Link>{" "}
            göz atın.
          </p>
        </div>
      </section>

      <CtaBand onAvukatGiris={() => setKvkkOpen(true)} />
      <KvkkModal open={kvkkOpen} onOpenChange={setKvkkOpen} />
    </>
  );
}
