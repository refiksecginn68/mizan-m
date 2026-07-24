import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { title: "Eklenti Gizlilik Politikası | Mizanım" };

// Chrome Web Store için eklenti gizlilik politikası sayfası
export default function EklentiGizlilikPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary py-4 px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-white">Mizanım</span>
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-heading text-3xl font-bold text-primary mb-2">
          Mizanım UYAP &amp; UETS Aktarım Eklentisi — Gizlilik Politikası
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Son güncelleme: 7 Temmuz 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">Özet</h2>
            <p>
              Mizanım UYAP &amp; UETS Aktarım eklentisi, <strong>yalnızca sizin talebinizle</strong> ve{" "}
              <strong>yalnızca sizin e-imzanızla açtığınız UYAP / UETS oturumunda</strong> ekranda
              görünen dosya ve tebligat bilgilerini okur ve bunları{" "}
              <strong>yalnızca sizin Mizanım hesabınıza</strong> iletir. Eklenti UYAP veya UETS&apos;e
              otomatik giriş yapmaz, e-imza işlemi gerçekleştirmez, şifre veya kimlik bilgisi toplamaz.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">1. Okunan Veriler</h2>
            <p>Eklenti, UYAP Avukat Portal sayfalarında görüntülenen şu alanları okur:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dosya esas numarası</li>
              <li>Mahkeme / birim adı</li>
              <li>Dosya (dava) türü</li>
              <li>Taraf adları (davacı/davalı, alacaklı/borçlu vb.)</li>
              <li>Dosya durumu ve açılış tarihi</li>
              <li>Safahat özet satırları (varsa)</li>
            </ul>
            <p className="mt-2">UETS (Ulusal Elektronik Tebligat Sistemi) sayfalarında ise şu alanları okur:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tebligat konusu ve tebligat numarası</li>
              <li>Gönderen kurum / birim adı</li>
              <li>Tebliğ tarihi ve tebligat durumu</li>
              <li>İlgili dosya esas numarası (varsa)</li>
            </ul>
            <p className="mt-2">
              Eklenti bunların dışında hiçbir sayfa içeriğini, çerezi, oturum bilgisini veya kişisel
              veriyi okumaz ve iletmez.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">2. Verinin Gittiği Yer</h2>
            <p>
              Okunan dosya ve tebligat bilgileri, sizin oluşturduğunuz bağlantı koduyla doğrulanarak{" "}
              <strong>https://mizanim.com</strong> üzerindeki kendi Mizanım
              hesabınıza HTTPS ile iletilir ve orada dava/tebligat kayıtlarınız olarak saklanır.
              Veriler üçüncü taraflarla paylaşılmaz, satılmaz, reklam veya analiz amacıyla kullanılmaz.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">3. Saklama</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Eklenti içinde:</strong> Yalnızca bağlantı kodunuz tarayıcınızın yerel
                depolamasında (chrome.storage.local) tutulur. Eklentiyi kaldırdığınızda silinir.
                Dosya ve tebligat verileri eklentide saklanmaz.
              </li>
              <li>
                <strong>Mizanım hesabınızda:</strong> Aktardığınız kayıtlar, siz silene kadar
                hesabınızda kalır ve Mizanım{" "}
                <Link href="/gizlilik-politikasi" className="text-accent hover:underline">
                  Gizlilik Politikası
                </Link>
                &apos;na tabidir.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">4. Otomatik Giriş Yapılmaz</h2>
            <p>
              Eklenti UYAP veya UETS oturumu AÇMAZ, e-imza/kart PIN&apos;i istemez, arka planda sorgu
              çalıştırmaz. Yalnızca sizin açtığınız oturumda, sizin bastığınız &quot;Sayfayı Tara /
              Mizanım&apos;a Aktar&quot; adımlarıyla çalışır.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">5. Bağlantı Kodu</h2>
            <p>
              Bağlantı kodu, hesabınıza özel imzalı bir anahtardır; 90 gün sonra kendiliğinden
              geçersizleşir. Kodunuzu kimseyle paylaşmayın. Mizanım&apos;dan yeni kod üreterek eski kodu
              geçersiz kılabilirsiniz (yeni kod üretmek eskisini otomatik iptal etmez; şüphe hâlinde
              destek ekibiyle iletişime geçin).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">6. Haklarınız (KVKK)</h2>
            <p>
              6698 sayılı KVKK kapsamındaki başvurularınız için:{" "}
              <a href="mailto:info@mizanim.com" className="text-accent hover:underline">info@mizanim.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">7. İletişim</h2>
            <p>
              Mizanım — <a href={process.env.NEXT_PUBLIC_APP_URL ?? "https://www.xn--mizanm-t9a.com"} className="text-accent hover:underline">https://mizanim.com</a> —{" "}
              <a href="mailto:info@mizanim.com" className="text-accent hover:underline">info@mizanim.com</a>
            </p>
          </section>
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground space-x-4">
        <Link href="/gizlilik-politikasi" className="hover:text-accent">Gizlilik Politikası</Link>
        <Link href="/kullanim-sartlari" className="hover:text-accent">Kullanım Şartları</Link>
        <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-accent">Mesafeli Satış</Link>
        <Link href="/cerez-politikasi" className="hover:text-accent">Çerez Politikası</Link>
        <span>© 2026 Mizanım</span>
      </footer>
    </div>
  );
}
