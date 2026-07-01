import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { title: "Mesafeli Satış Sözleşmesi | Mizanım" };

export default function MesafeliSatisSozlesmesiPage() {
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
        <h1 className="font-heading text-3xl font-bold text-primary mb-2">Mesafeli Satış Sözleşmesi</h1>
        <p className="text-sm text-muted-foreground mb-8">
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca hazırlanmıştır.
        </p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">1. Taraflar</h2>
            <p><strong>Satıcı:</strong> Mizanım Teknoloji A.Ş. — info@mizanim.com</p>
            <p><strong>Alıcı:</strong> Platforma kayıtlı kullanıcı (işbu sözleşmeyi kabul eden taraf)</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">2. Konu</h2>
            <p>
              İşbu sözleşme, Alıcı&apos;nın Mizanım platformu üzerinden satın aldığı dijital hizmetleri
              (kredi paketi ve abonelik planları) kapsamaktadır.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">3. Hizmet Bedeli ve Ödeme</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Hizmet bedelleri Platform üzerinde güncel fiyat listesinde belirtilmektedir.</li>
              <li>Ödemeler iyzico altyapısı ile TL cinsinden alınmaktadır.</li>
              <li>Kart bilgileri Mizanım sistemlerinde saklanmaz.</li>
              <li>Abonelik ücretleri otomatik olarak her dönem başında tahsil edilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">4. Cayma Hakkı</h2>
            <p>
              6502 sayılı Kanun&apos;un 49. maddesi uyarınca, tüketici sözleşmenin kurulmasından itibaren
              <strong> 14 gün içinde herhangi bir gerekçe göstermeksizin cayma hakkını</strong> kullanabilir.
            </p>
            <p className="mt-2 font-semibold text-danger">
              Dijital İçerik İstisnası: Kullanıcının onayıyla hizmet ifasına başlanmışsa (kredi kullanılmışsa
              veya AI sorgusu yapılmışsa), 6502 sayılı Kanun m.49/1-ğ uyarınca dijital içerik istisnası
              kapsamında cayma hakkı sona erer.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">5. İade Politikası</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kullanılmayan kredi paketleri için 14 gün içinde tam iade yapılır.</li>
              <li>Kısmen kullanılmış kredi paketlerinde kullanılan kısım iade edilmez.</li>
              <li>Abonelik iptali bir sonraki dönem için geçerlidir; cari dönem ücretleri iade edilmez.</li>
              <li>İade talepleri için: <a href="mailto:iade@mizanim.com" className="text-accent hover:underline">iade@mizanim.com</a></li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">6. Abonelik İptali</h2>
            <p>
              Aboneliğinizi istediğiniz zaman Platform hesap ayarlarından veya
              <a href="mailto:info@mizanim.com" className="text-accent hover:underline"> info@mizanim.com</a> adresine
              yazarak iptal edebilirsiniz. İptal, mevcut fatura döneminin sonunda geçerli olur.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">7. Uyuşmazlık Çözümü</h2>
            <p>
              Uyuşmazlıklarda önce Tüketici Hakem Heyeti, akabinde Tüketici Mahkemesi yetkilidir.
              Başvuru sınırı için yıllık güncellenen Tüketici Hakem Heyeti parasal sınırlarına bakınız.
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
