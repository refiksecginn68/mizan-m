// UYARI: Bu metin taslaktır, yayına almadan önce hukuk müşavirine onaylatılmalıdır.
import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Mizanım",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Mizanım aydınlatma metni: işlenen veriler, amaçlar, hukuki sebepler ve haklarınız.",
  alternates: { canonical: "/kvkk" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "veri-sorumlusu",
    title: "Veri Sorumlusu",
    content: (
      <>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca kişisel
          verileriniz, veri sorumlusu sıfatıyla <strong>Mizanım</strong> (&ldquo;Platform&rdquo;)
          tarafından aşağıda açıklanan kapsamda işlenmektedir.
        </p>
        <p>
          Bu aydınlatma metni, Mizanım web sitesi ile Mizanım tarayıcı eklentisini kullanan
          avukat ve vatandaş kullanıcıları kapsar.
        </p>
      </>
    ),
  },
  {
    id: "islenen-veriler",
    title: "İşlenen Kişisel Veriler",
    content: (
      <>
        <p>Platform üzerinde aşağıdaki veri kategorileri işlenmektedir:</p>
        <ul>
          <li><strong>Kimlik ve iletişim verileri:</strong> ad-soyad, e-posta adresi, telefon (isteğe bağlı), avukat kullanıcılar için baro ve sicil bilgisi.</li>
          <li><strong>Hesap ve işlem verileri:</strong> abonelik planı, sorgu kullanım kayıtları, ödeme referans bilgileri (kart bilgisi saklanmaz).</li>
          <li><strong>Hizmet içeriği verileri:</strong> yüklediğiniz belgeler, sorularınız, oluşturduğunuz dilekçe ve dosya kayıtları.</li>
          <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı bilgisi, oturum ve güvenlik kayıtları, çerezler.</li>
        </ul>
        <p>
          Avukat kullanıcıların platforma aktardığı müvekkil verileri bakımından avukat,
          kendi müvekkilleri karşısında veri sorumlusu; Mizanım ise veri işleyen konumundadır.
        </p>
      </>
    ),
  },
  {
    id: "isleme-amaclari",
    title: "İşleme Amaçları",
    content: (
      <ul>
        <li>Üyelik oluşturulması, kimlik doğrulama ve hesabın yönetilmesi,</li>
        <li>Emsal arama, belge analizi, dilekçe üretimi gibi hizmetlerin sunulması,</li>
        <li>Abonelik ve ödeme süreçlerinin yürütülmesi, faturalandırma,</li>
        <li>Hizmet güvenliğinin sağlanması, kötüye kullanımın önlenmesi,</li>
        <li>Destek taleplerinin yanıtlanması ve bildirimlerin iletilmesi,</li>
        <li>Mevzuattan doğan yükümlülüklerin yerine getirilmesi.</li>
      </ul>
    ),
  },
  {
    id: "hukuki-sebepler",
    title: "Hukuki Sebepler",
    content: (
      <p>
        Kişisel verileriniz; KVKK m.5/2 uyarınca <strong>sözleşmenin kurulması ve ifası</strong>,
        <strong> hukuki yükümlülüğün yerine getirilmesi</strong>, <strong>meşru menfaat</strong> ve
        gerekli hâllerde <strong>açık rızanız</strong> hukuki sebeplerine dayanılarak işlenir.
        Açık rızaya dayalı işlemeler, rızanızı geri çekmenizle birlikte durdurulur.
      </p>
    ),
  },
  {
    id: "aktarim",
    title: "Verilerin Aktarılması",
    content: (
      <>
        <p>
          Kişisel verileriniz ticari amaçla üçüncü kişilere satılmaz veya kiralanmaz.
          Veriler yalnızca aşağıdaki sınırlı hâllerde aktarılır:
        </p>
        <ul>
          <li>Barındırma, e-posta ve ödeme altyapısı sağlayan, sözleşmeyle sır saklama yükümlülüğü altındaki hizmet sağlayıcılara,</li>
          <li>Yapay zekâ çıktısı üretmek için işlenen içeriğin, <strong>eğitimde kullanılmama garantisi veren</strong> model sağlayıcılarına iletilmesi kapsamında,</li>
          <li>Yetkili kamu kurumlarının hukuka uygun talepleri hâlinde.</li>
        </ul>
        <p>
          Yüklediğiniz belgeler ve dava bilgileri hiçbir yapay zekâ modelinin eğitiminde
          kullanılmaz.
        </p>
      </>
    ),
  },
  {
    id: "saklama",
    title: "Saklama Süreleri",
    content: (
      <p>
        Veriler, işleme amacının gerektirdiği süre ve mevzuatın öngördüğü asgari saklama
        süreleri boyunca tutulur. Hesabınızı sildiğinizde hizmet içeriği verileriniz kalıcı
        olarak silinir; fatura ve işlem kayıtları ise vergi mevzuatının öngördüğü süre
        boyunca ayrık biçimde saklanır.
      </p>
    ),
  },
  {
    id: "haklariniz",
    title: "KVKK m.11 Kapsamındaki Haklarınız",
    content: (
      <>
        <p>KVKK m.11 uyarınca;</p>
        <ul>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme,</li>
          <li>İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>Eksik veya yanlış işlenen verilerin düzeltilmesini isteme,</li>
          <li>KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme,</li>
          <li>İşlemenin münhasıran otomatik sistemlerle analizi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
          <li>Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
        </ul>
        <p>
          haklarına sahipsiniz. Başvurularınızı iletişim sayfamız üzerinden veya kayıtlı
          e-posta adresinizle iletebilirsiniz; başvurular en geç 30 gün içinde yanıtlanır.
        </p>
      </>
    ),
  },
];

// KVKK Aydınlatma Metni sayfası
export default function KvkkPage() {
  return <LegalPage title="KVKK Aydınlatma Metni" updatedAt="12 Temmuz 2026" sections={SECTIONS} />;
}
