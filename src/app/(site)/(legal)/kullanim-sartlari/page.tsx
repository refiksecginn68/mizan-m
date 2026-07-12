// UYARI: Bu metin taslaktır, yayına almadan önce hukuk müşavirine onaylatılmalıdır.
import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Kullanım Şartları — Mizanım",
  description:
    "Mizanım kullanım şartları: hizmetin kapsamı, kullanıcı yükümlülükleri, abonelik, fikri mülkiyet ve sorumluluk sınırları.",
  alternates: { canonical: "/kullanim-sartlari" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "taraflar-kapsam",
    title: "Taraflar ve Kapsam",
    content: (
      <p>
        Bu şartlar, <strong>Mizanım</strong> (&ldquo;Platform&rdquo;) ile platformu kullanan gerçek
        veya tüzel kişi (&ldquo;Kullanıcı&rdquo;) arasında, üyelik oluşturulması veya hizmetin
        kullanılmasıyla yürürlüğe girer. Platformu kullanmakla bu şartları okuduğunuzu ve
        kabul ettiğinizi beyan etmiş olursunuz. Şartları kabul etmiyorsanız lütfen
        platformu kullanmayınız.
      </p>
    ),
  },
  {
    id: "hizmetin-niteligi",
    title: "Hizmetin Niteliği",
    content: (
      <>
        <p>
          Mizanım; emsal karar arama, mevzuat sorgulama, belge analizi, dilekçe taslağı
          üretimi ve büro yönetimi araçları sunan bir <strong>yazılım hizmetidir</strong>.
        </p>
        <p>
          <strong>Mizanım hukuki danışmanlık hizmeti değildir.</strong> Platform çıktıları
          bilgilendirme amaçlıdır; avukat görüşünün, hukuki mütalaanın veya vekillik
          hizmetinin yerini tutmaz. Yapay zekâ çıktıları hata içerebilir; nihai
          değerlendirme her zaman kullanıcıya aittir.
        </p>
      </>
    ),
  },
  {
    id: "kullanici-yukumlulukleri",
    title: "Kullanıcı Yükümlülükleri",
    content: (
      <ul>
        <li>Kayıt bilgilerinin doğru ve güncel tutulması,</li>
        <li>Hesap bilgilerinin üçüncü kişilerle paylaşılmaması; hesapta gerçekleşen işlemlerin sorumluluğunun üstlenilmesi,</li>
        <li>Avukat hesaplarında, aktarılan müvekkil verileri bakımından KVKK ve meslek kurallarına uyulması,</li>
        <li>Platformun hukuka aykırı içerik üretmek, tersine mühendislik yapmak veya sistemlere zarar vermek amacıyla kullanılmaması,</li>
        <li>Üretilen içeriklerin mahkemeye veya resmî mercilere sunulmadan önce gözden geçirilmesi.</li>
      </ul>
    ),
  },
  {
    id: "abonelik-odeme",
    title: "Abonelik ve Ödeme",
    content: (
      <>
        <p>
          Ücretli planlar aylık abonelik veya kredi paketi olarak sunulur; güncel fiyatlar
          fiyatlandırma sayfasında yayımlanır ve KDV dahildir. Avukat planlarında 14 günlük
          ücretsiz deneme tanınır.
        </p>
        <p>
          Abonelik dilediğiniz an iptal edilebilir; iptal hâlinde dönem sonuna kadar erişim
          sürer, sonraki dönem ücreti alınmaz. Kullanılmış dönem için ücret iadesi yapılmaz;
          hizmetin bizden kaynaklanan nedenlerle kesintiye uğradığı hâller saklıdır.
        </p>
      </>
    ),
  },
  {
    id: "fikri-mulkiyet",
    title: "Fikri Mülkiyet",
    content: (
      <p>
        Platformun yazılımı, arayüzü, markası ve içerik düzeni Mizanım&apos;a aittir.
        Kullanıcının yüklediği belgeler kullanıcıya, platform aracılığıyla ürettiği dilekçe
        ve analiz çıktıları da kullanıcıya aittir; Mizanım bu çıktılar üzerinde hak iddia
        etmez. Kullanıcı, platformu kopyalamamayı, çoğaltmamayı ve izinsiz ticari amaçla
        dağıtmamayı kabul eder.
      </p>
    ),
  },
  {
    id: "sorumluluk",
    title: "Sorumluluğun Sınırlandırılması",
    content: (
      <>
        <p>
          Platform &ldquo;olduğu gibi&rdquo; sunulur. Mizanım; kesintisiz erişim, hatasız çıktı
          veya belirli bir sonucun elde edileceği garantisi vermez.
        </p>
        <p>
          Yapay zekâ çıktısına dayanılarak alınan kararlardan, kaçırılan sürelerden veya
          üçüncü kişilerle ilişkilerden doğan zararlardan, kasıt ve ağır kusur hâlleri
          dışında Mizanım sorumlu tutulamaz. Her hâlde sorumluluk, zarara yol açan olayın
          gerçekleştiği dönemde kullanıcının ödediği son aylık ücretle sınırlıdır.
        </p>
      </>
    ),
  },
  {
    id: "fesih",
    title: "Askıya Alma ve Fesih",
    content: (
      <p>
        Bu şartların ihlali, sistem güvenliğini tehdit eden kullanım veya mevzuata aykırılık
        hâlinde Mizanım, hesabı önceden bildirerek ya da ihlalin ağırlığına göre derhâl
        askıya alabilir veya sonlandırabilir. Kullanıcı da hesabını dilediği an
        kapatabilir; kapanış hâlinde veriler gizlilik politikasında açıklanan usulle silinir.
      </p>
    ),
  },
  {
    id: "uygulanacak-hukuk",
    title: "Uygulanacak Hukuk ve Yetki",
    content: (
      <p>
        Bu şartlar Türk hukukuna tabidir. Uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri
        ve İcra Daireleri yetkilidir. Şartlarda yapılacak değişiklikler bu sayfada
        yayımlanır; önemli değişiklikler e-posta ile bildirilir.
      </p>
    ),
  },
];

// Kullanım Şartları sayfası
export default function KullanimSartlariPage() {
  return <LegalPage title="Kullanım Şartları" updatedAt="12 Temmuz 2026" sections={SECTIONS} />;
}
