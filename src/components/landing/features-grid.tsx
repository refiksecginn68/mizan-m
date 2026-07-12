"use client";

import { motion } from "framer-motion";
import {
  Bot, SearchCheck, FileText, FileSearch, Users, CalendarClock,
  Landmark, MailCheck, MessageCircleQuestion, FileWarning, Scale, FilePen,
} from "lucide-react";
import SectionHeading from "@/components/landing/section-heading";

interface Feature {
  icon: typeof Bot;
  title: string;
  description: string;
  badge?: string;
}

const AVUKAT_FEATURES: Feature[] = [
  { icon: Bot, title: "MizanAI Hukuk Asistanı", description: "Dava bağlamını bilen sohbet — dosyanızı tanır, ona göre yanıt verir." },
  { icon: SearchCheck, title: "Emsal & Mevzuat Arama", description: "Sınırsız arama, kotadan düşmez. Milyonlarca karar saniyeler içinde." },
  { icon: FilePen, title: "Dilekçe Üretimi", description: "Tek tıkla kurumsal formatta taslak; düzenleyin, indirin, kullanın." },
  { icon: FileSearch, title: "Belge Analizi", description: "PDF/DOCX yükleyin; özet, risk ve kritik maddeleri anında görün." },
  { icon: Users, title: "CRM & Müvekkil Yönetimi", description: "Müvekkil, dosya ve finans kayıtları tek panelde, düzenli." },
  { icon: CalendarClock, title: "Dava Takibi + Akıllı Takvim", description: "Duruşma, süre ve görevler; aciliyet ve hatırlatıcılarla." },
  { icon: Landmark, title: "UYAP Entegrasyonu", description: "Dosyalarınızı tarayıcı eklentisiyle tek tıkla aktarın.", badge: "Max" },
  { icon: MailCheck, title: "UETS E-Tebligat Takibi", description: "E-tebligatlarınız dosyalarınızla otomatik eşleşir.", badge: "Max" },
];

const VATANDAS_FEATURES: Feature[] = [
  { icon: MessageCircleQuestion, title: "Hukuki Soru-Cevap", description: "Sorunuzu yazın; anlaşılır dille, dayanağıyla birlikte yanıt alın." },
  { icon: FileWarning, title: "Belge Analizi", description: "Sözleşmenizi yükleyin; riskleri ve dikkat edilecek maddeleri görün." },
  { icon: Scale, title: "Emsal Arama", description: "Durumunuza benzer davalarda mahkemeler ne karar vermiş, öğrenin." },
  { icon: FileText, title: "Dilekçe Taslağı", description: "İhtiyacınıza uygun dilekçe taslağını dakikalar içinde hazırlayın." },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: "easeOut" as const },
  }),
};

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <motion.li
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="group relative bg-navy-800 border border-navy-700 rounded-xl p-6 transition-all duration-300 hover:border-gold-500/40 hover:-translate-y-1"
    >
      {feature.badge && (
        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-inter font-semibold uppercase tracking-wider text-gold-300 border border-gold-500/40">
          {feature.badge}
        </span>
      )}
      <feature.icon aria-hidden className="w-6 h-6 text-gold-500 mb-4" />
      <h4 className="font-inter text-base font-semibold text-cream mb-2">{feature.title}</h4>
      <p className="font-inter text-sm text-cream/55 leading-relaxed">{feature.description}</p>
    </motion.li>
  );
}

// Özellikler: Avukat Portalı ve Vatandaş Paneli iki sütun halinde
export default function FeaturesGrid() {
  return (
    <section id="ozellikler" className="bg-navy-900 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Platform"
          title="İki taraf, tek terazi"
          description="Avukatlar için tam donanımlı bir büro; vatandaşlar için anlaşılır bir hukuk rehberi."
        />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-14">
          {/* Avukat Portalı */}
          <div>
            <div className="border-l-2 border-gold-500 pl-4 mb-8">
              <h3 className="font-heading text-2xl font-bold text-cream">Avukat Portalı</h3>
              <p className="font-inter text-sm text-cream/50 mt-1">Büronuzun dijital karargâhı</p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-4">
              {AVUKAT_FEATURES.map((f, i) => (
                <FeatureCard key={f.title} feature={f} index={i} />
              ))}
            </ul>
          </div>

          {/* Vatandaş Paneli */}
          <div>
            <div className="border-l-2 border-gold-500 pl-4 mb-8">
              <h3 className="font-heading text-2xl font-bold text-cream">Vatandaş Paneli</h3>
              <p className="font-inter text-sm text-cream/50 mt-1">Hukuku anlaşılır kılan rehberiniz</p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-4">
              {VATANDAS_FEATURES.map((f, i) => (
                <FeatureCard key={f.title} feature={f} index={i} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
