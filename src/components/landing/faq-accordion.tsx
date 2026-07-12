"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import SectionHeading from "@/components/landing/section-heading";

export interface FaqItem {
  question: string;
  answer: string;
}

export const LANDING_FAQS: FaqItem[] = [
  {
    question: "Mizanım avukatın yerini alır mı?",
    answer:
      "Hayır. Mizanım bir araçtır; hukuki değerlendirme ve temsil yetkisi yalnızca avukata aittir. Platform, avukatın araştırma ve belge hazırlama süresini kısaltır; vatandaşa ise durumunu anlaması için ön bilgi sunar. Üretilen hiçbir içerik hukuki danışmanlık veya avukat görüşü yerine geçmez.",
  },
  {
    question: "Verilerim güvende mi? Müvekkil dosyalarım nereye gidiyor?",
    answer:
      "Dosyalarınız şifreli bağlantı üzerinden iletilir ve erişim kontrollü altyapıda saklanır. Yüklediğiniz hiçbir belge veya dava bilgisi yapay zekâ modellerinin eğitiminde kullanılmaz, üçüncü taraflara satılmaz. İşleyiş 6698 sayılı KVKK ve Avukatlık Kanunu'nun sır saklama yükümlülüğü (m.36) gözetilerek tasarlanmıştır.",
  },
  {
    question: "Emsal araması kotamdan düşer mi?",
    answer:
      "Hayır. Avukat planlarında emsal ve mevzuat aramaları sınırsızdır, aylık sorgu kotanızdan düşmez. Kota yalnızca MizanAI asistan sohbetleri, belge analizi ve dilekçe üretimi gibi yapay zekâ işlemlerinde kullanılır.",
  },
  {
    question: "UYAP entegrasyonu nasıl çalışıyor?",
    answer:
      "Chrome eklentimiz, sizin açtığınız UYAP oturumunda ekranda görünen dosya listesini okur ve onayınızla Mizanım'a aktarır. Eklenti UYAP'a otomatik giriş yapmaz, e-imza PIN'inize veya şifrenize hiçbir şekilde erişmez. UYAP entegrasyonu Avukat Max planında sunulur.",
  },
  {
    question: "Aboneliğimi istediğim zaman iptal edebilir miyim?",
    answer:
      "Evet. Aboneliğinizi dilediğiniz an iptal edebilirsiniz; dönem sonuna kadar erişiminiz devam eder, sonraki dönem için ücret alınmaz. İptal için panelinizden tek tık yeterlidir, ayrıca bir taahhüt veya cayma bedeli yoktur.",
  },
  {
    question: "Vatandaş paketiyle avukat paketi arasındaki fark ne?",
    answer:
      "Vatandaş paketi; soru-cevap, belge analizi ve dilekçe taslağı gibi bireysel ihtiyaçlara odaklanır ve kredi bazlı çalışır. Avukat paketleri ise büro yönetimi (CRM, takvim, dava takibi), sınırsız emsal arama, dava bağlamını bilen MizanAI asistanı ve Max planında UYAP/UETS entegrasyonlarını içerir.",
  },
];

interface FaqAccordionProps {
  /** Farklı sayfalarda farklı soru listeleri kullanılabilir */
  items?: FaqItem[];
  /** Bölüm başlığı gösterilsin mi (SSS sayfasında kapatılır) */
  showHeading?: boolean;
}

// SSS akordiyonu — klavye erişilebilir, tek seferde bir panel açık
export default function FaqAccordion({ items = LANDING_FAQS, showHeading = true }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-navy-950 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        {showHeading && (
          <SectionHeading
            eyebrow="SSS"
            title="Merak edilenler"
            description="Kısa, net ve dürüst yanıtlar."
          />
        )}

        <div className={showHeading ? "mt-12" : ""}>
          {items.map((item, i) => {
            const open = openIndex === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <motion.div
                key={item.question}
                className="border-b border-navy-800"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left group focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500 rounded"
                  >
                    <span className={`font-inter text-base md:text-lg font-medium transition-colors ${open ? "text-gold-300" : "text-cream group-hover:text-gold-100"}`}>
                      {item.question}
                    </span>
                    <Plus
                      aria-hidden
                      className={`w-5 h-5 flex-shrink-0 text-gold-500 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="font-inter text-sm md:text-base text-cream/60 leading-[1.7] pb-6 pr-8">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
