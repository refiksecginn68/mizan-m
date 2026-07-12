// UYARI: Bu metin taslaktır, yayına almadan önce hukuk müşavirine onaylatılmalıdır.
import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Yasal Uyarı — Mizanım",
  description:
    "Mizanım yasal uyarı ve sorumluluk reddi: platform çıktılarının niteliği, avukat-müvekkil ilişkisi ve kullanım sınırları.",
  alternates: { canonical: "/yasal-uyari" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "danismanlik-degildir",
    title: "Hukuki Danışmanlık Değildir",
    content: (
      <>
        <p>
          <strong>Mizanım hukuki danışmanlık hizmeti değildir. Üretilen içerikler
          bilgilendirme amaçlıdır ve avukat görüşünün yerini tutmaz.</strong>
        </p>
        <p>
          Platformdaki emsal kararlar, mevzuat özetleri, belge analizleri ve dilekçe
          taslakları; yapay zekâ ve otomatik sistemler tarafından üretilen yardımcı
          içeriklerdir. Somut olayınız hakkında hukuki değerlendirme yalnızca yetkili bir
          avukat tarafından yapılabilir.
        </p>
      </>
    ),
  },
  {
    id: "vekalet-iliskisi",
    title: "Avukat-Müvekkil İlişkisi Doğmaz",
    content: (
      <p>
        Platformun kullanılması, Mizanım ile kullanıcı arasında veya platform üzerinden
        herhangi bir avukatla kullanıcı arasında vekâlet ilişkisi, avukat-müvekkil ilişkisi
        ya da hukuki temsil ilişkisi doğurmaz. Mizanım bir avukatlık ortaklığı veya hukuk
        bürosu değildir; 1136 sayılı Avukatlık Kanunu kapsamında avukatlara özgü faaliyet
        yürütmez.
      </p>
    ),
  },
  {
    id: "dogruluk",
    title: "İçeriklerin Doğruluğu",
    content: (
      <>
        <p>
          Emsal kararlar ve mevzuat, resmî kaynaklardan derlenir; ancak yayım sonrası
          değişiklikler, içtihat farklılıkları veya aktarım hataları nedeniyle içerik
          güncel ya da eksiksiz olmayabilir. Yapay zekâ çıktıları hatalı, eksik veya
          yanıltıcı olabilir.
        </p>
        <p>
          Bu nedenle platformdan edindiğiniz her bilgiyi, işlem yapmadan önce resmî
          kaynağından (Resmî Gazete, UYAP, ilgili mahkeme kalemi) doğrulayınız.
        </p>
      </>
    ),
  },
  {
    id: "sure-riski",
    title: "Süreler ve Hak Kayıpları",
    content: (
      <p>
        Hukuki süreler (dava açma, itiraz, temyiz, zamanaşımı vb.) hak düşürücü sonuçlar
        doğurur. Platformun takvim ve hatırlatma özellikleri yardımcı araçtır; sürelerin
        takibi ve hesaplanması sorumluluğu kullanıcıya aittir. Bildirimin ulaşmaması,
        gecikmesi veya hatalı hesaplanması nedeniyle doğabilecek hak kayıplarından Mizanım
        sorumlu tutulamaz.
      </p>
    ),
  },
  {
    id: "sorumluluk-reddi",
    title: "Sorumluluk Reddi",
    content: (
      <p>
        Platform çıktılarına dayanılarak yapılan işlemlerden, verilen kararlardan ve bu
        işlemlerin sonuçlarından kullanıcı sorumludur. Mizanım; dolaylı zararlar, kâr
        kaybı, veri kaybı veya üçüncü kişi talepleri bakımından, emredici hükümler saklı
        kalmak üzere sorumluluk kabul etmez. Ayrıntılı sorumluluk düzenlemesi için
        Kullanım Şartları&apos;na bakınız.
      </p>
    ),
  },
  {
    id: "resmi-kurum",
    title: "Resmî Kurumlarla İlişki",
    content: (
      <p>
        Mizanım; Adalet Bakanlığı, UYAP, PTT/UETS veya herhangi bir resmî kurumla organik
        bağı olmayan bağımsız bir platformdur. UYAP ve UETS aktarım özellikleri, yalnızca
        kullanıcının kendi oturumunda görüntülediği verilerin kullanıcı onayıyla
        aktarılmasını sağlar; resmî sistemlere doğrudan erişim veya entegrasyon iddiası
        taşımaz.
      </p>
    ),
  },
];

// Yasal Uyarı ve Sorumluluk Reddi sayfası
export default function YasalUyariPage() {
  return <LegalPage title="Yasal Uyarı ve Sorumluluk Reddi" updatedAt="12 Temmuz 2026" sections={SECTIONS} />;
}
