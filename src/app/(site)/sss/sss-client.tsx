"use client";

import Link from "next/link";
import FaqAccordion, { LANDING_FAQS, type FaqItem } from "@/components/landing/faq-accordion";
import SectionHeading from "@/components/landing/section-heading";

// Landing'deki 6 soruya ek, SSS sayfasına özel sorular
const EXTRA_FAQS: FaqItem[] = [
  {
    question: "Ödemeler nasıl yapılıyor? Fatura alabilir miyim?",
    answer:
      "Ödemeler banka havalesi/EFT ile referans kodu üzerinden alınır; ödemeniz doğrulandığında paketiniz dakikalar içinde tanımlanır. Tüm planlar KDV dahildir ve her ödeme için e-arşiv fatura düzenlenir. Kurumsal (Büro) planlarında sözleşmeli faturalandırma yapılır.",
  },
  {
    question: "Sorgu kotam biterse ne olur?",
    answer:
      "Panelinizden ek sorgu paketi satın alabilirsiniz; mevcut aboneliğiniz etkilenmez. Emsal ve mevzuat aramaları kotadan bağımsız olduğu için araştırmaya kesintisiz devam edersiniz. Kullanılmayan ek sorgular sonraki döneme devreder.",
  },
  {
    question: "Mizanım'ı telefonumdan kullanabilir miyim?",
    answer:
      "Evet. Mizanım web tabanlıdır ve mobil tarayıcıda tam çalışır; siteyi ana ekranınıza ekleyerek (PWA) uygulama gibi kullanabilirsiniz. UYAP/UETS aktarımı ise eklenti gerektirdiği için yalnızca masaüstü Chrome'da yapılır.",
  },
  {
    question: "Ürettiğim dilekçeyi doğrudan mahkemeye verebilir miyim?",
    answer:
      "Taslaklar resmî formata uygun üretilir; ancak her dosyanın kendine özgü koşulları vardır. Dilekçenizi vermeden önce mutlaka gözden geçirin, avukatsanız mesleki değerlendirmenizden geçirin, vatandaşsanız mümkünse bir avukata danışın. Mizanım çıktıları hukuki danışmanlık yerine geçmez.",
  },
  {
    question: "Hesabımı ve verilerimi tamamen silebilir miyim?",
    answer:
      "Evet. Hesap silme talebinizde profiliniz, dosyalarınız ve sohbet geçmişiniz kalıcı olarak silinir; yasal saklama yükümlülüğü bulunan fatura kayıtları mevzuatın öngördüğü süre boyunca ayrık olarak tutulur. Talebinizi panelinizden veya iletisim sayfasından iletebilirsiniz.",
  },
  {
    question: "Yapay zekâ yanıtları ne kadar güvenilir?",
    answer:
      "MizanAI, yanıtlarını emsal kararlara ve mevzuata dayandırır ve kaynağını belirtir; yine de yapay zekâ hata yapabilir. Bu nedenle kritik kararlarınızı yalnızca platform çıktısına dayandırmamanızı, dayanak gösterilen karar ve maddeleri doğrulamanızı öneririz. Şüpheye düştüğünüz her yanıtı bize bildirebilirsiniz.",
  },
];

// SSS sayfası: başlık + 12 soruluk akordiyon + iletişim yönlendirmesi
export default function SssClient() {
  return (
    <>
      <section className="bg-navy-950 pt-32 md:pt-40 pb-4">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <SectionHeading
            eyebrow="Destek"
            title="Sık Sorulan Sorular"
            description="Aradığınız yanıt burada yoksa, iletişim sayfasından bize yazın — genellikle aynı gün dönüş yapıyoruz."
          />
        </div>
      </section>

      <FaqAccordion items={[...LANDING_FAQS, ...EXTRA_FAQS]} showHeading={false} />

      <section className="bg-navy-950 pb-20 md:pb-28 -mt-8">
        <div className="mx-auto max-w-3xl px-5 md:px-8 text-center">
          <p className="font-inter text-sm text-cream/50">
            Başka bir sorunuz mu var?{" "}
            <Link href="/iletisim" className="text-gold-300 hover:text-gold-100 underline underline-offset-2">
              Bize ulaşın
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
