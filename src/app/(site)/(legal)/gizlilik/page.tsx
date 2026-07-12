// UYARI: Bu metin taslaktır, yayına almadan önce hukuk müşavirine onaylatılmalıdır.
import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — Mizanım",
  description:
    "Mizanım gizlilik politikası: verilerinizin nasıl korunduğu, çerezler, üçüncü taraf hizmetler ve güvenlik önlemleri.",
  alternates: { canonical: "/gizlilik" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "genel-ilkeler",
    title: "Genel İlkeler",
    content: (
      <>
        <p>
          Mizanım, bir hukuk platformu olmanın getirdiği sorumlulukla gizliliği ürünün bir
          özelliği değil, ön koşulu olarak görür. Bu politika; hangi verileri neden
          topladığımızı, nasıl koruduğumuzu ve neleri <strong>asla yapmadığımızı</strong> açıklar.
        </p>
        <ul>
          <li>Verileriniz reklam amacıyla profillenmez, üçüncü taraflara satılmaz.</li>
          <li>Yüklediğiniz belgeler ve sohbetleriniz yapay zekâ modellerinin eğitiminde kullanılmaz.</li>
          <li>Yalnızca hizmetin çalışması için gereken asgari veri toplanır.</li>
        </ul>
      </>
    ),
  },
  {
    id: "hesap-verileri",
    title: "Hesap ve Kullanım Verileri",
    content: (
      <p>
        Kayıt sırasında ad-soyad ve e-posta adresiniz; kullanım sırasında ise abonelik ve
        sorgu kayıtlarınız tutulur. Parolanız geri döndürülemez biçimde özetlenerek (hash)
        saklanır; hiçbir çalışanımız parolanızı göremez. Ödemelerde kart bilgisi
        sistemimizde tutulmaz; havale/EFT ödemeleri referans koduyla eşleştirilir.
      </p>
    ),
  },
  {
    id: "icerik-verileri",
    title: "Yüklediğiniz İçerikler",
    content: (
      <>
        <p>
          Belgeleriniz, sorularınız ve dilekçeleriniz hesabınıza bağlı olarak şifreli
          bağlantı (TLS) üzerinden iletilir ve erişim kontrollü veritabanında saklanır.
          Satır düzeyinde güvenlik (RLS) sayesinde her kullanıcı yalnızca kendi verisine
          erişebilir.
        </p>
        <p>
          Yapay zekâ yanıtı üretmek için içerik, işlendiği anda ilgili model sağlayıcısına
          iletilir; sözleşmelerimiz bu içeriğin <strong>eğitim verisi olarak kullanılmamasını
          ve kalıcı saklanmamasını</strong> şart koşar.
        </p>
      </>
    ),
  },
  {
    id: "cerezler",
    title: "Çerezler",
    content: (
      <>
        <p>Platformda üç tür çerez kullanılır:</p>
        <ul>
          <li><strong>Zorunlu çerezler:</strong> oturumunuzu açık tutar; bunlar olmadan platform çalışmaz.</li>
          <li><strong>Tercih çerezleri:</strong> dil ve görünüm tercihlerinizi hatırlar.</li>
          <li><strong>Analitik çerezler (isteğe bağlı):</strong> yalnızca onay vermeniz hâlinde, toplu kullanım istatistiği için çalışır.</li>
        </ul>
        <p>Çerez tercihlerinizi tarayıcınızdan veya çerez bildirimimizden yönetebilirsiniz.</p>
      </>
    ),
  },
  {
    id: "ucuncu-taraflar",
    title: "Üçüncü Taraf Hizmetler",
    content: (
      <p>
        Barındırma, veritabanı, e-posta iletimi ve yapay zekâ çıkarımı için sınırlı sayıda
        hizmet sağlayıcıyla çalışırız. Her sağlayıcıyla veri işleme sözleşmesi yapılır ve
        erişim, hizmetin gerektirdiği asgari kapsamla sınırlanır. Tarayıcı eklentimiz
        UYAP/UETS sayfalarında yalnızca sizin açtığınız oturumda görünen listeyi okur;
        şifrenize, e-imzanıza veya PIN&apos;inize hiçbir şekilde erişmez.
      </p>
    ),
  },
  {
    id: "guvenlik",
    title: "Güvenlik Önlemleri",
    content: (
      <ul>
        <li>Tüm trafik TLS ile şifrelenir; veriler şifreli altyapıda saklanır.</li>
        <li>Erişim, rol bazlı yetkilendirme ve satır düzeyi güvenlik (RLS) ile sınırlanır.</li>
        <li>Sistemlere erişim kayıt altına alınır ve düzenli gözden geçirilir.</li>
        <li>Bir veri ihlali şüphesinde, mevzuatın öngördüğü sürede ilgili kişiler ve Kurum bilgilendirilir.</li>
      </ul>
    ),
  },
  {
    id: "degisiklikler",
    title: "Politika Değişiklikleri",
    content: (
      <p>
        Bu politika gerektiğinde güncellenebilir. Önemli değişikliklerde kayıtlı e-posta
        adresinize bildirim yapılır ve sayfanın üst kısmındaki &ldquo;son güncelleme&rdquo;
        tarihi yenilenir. Güncel sürüm her zaman bu sayfada yayımlanır.
      </p>
    ),
  },
];

// Gizlilik Politikası sayfası
export default function GizlilikPage() {
  return <LegalPage title="Gizlilik Politikası" updatedAt="12 Temmuz 2026" sections={SECTIONS} />;
}
