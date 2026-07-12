import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { title: "Kullanım Şartları | Mizanım" };

export default function KullanimSartlariPage() {
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
        <h1 className="font-heading text-3xl font-bold text-primary mb-2">Kullanım Şartları</h1>
        <p className="text-sm text-muted-foreground mb-8">Son güncelleme: 1 Ocak 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">1. Hizmet Kapsamı</h2>
            <p>
              Mizanım, Türkiye Cumhuriyeti hukukuna ilişkin bilgi sağlayan, yapay zeka destekli bir
              dijital platformdur. Platform; emsal karar arama, mevzuat arama, belge analizi, dilekçe
              üretimi ve hukuki soru-cevap hizmetleri sunmaktadır.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">2. Hukuki Bilgi — Tavsiye Değil</h2>
            <p className="font-semibold text-danger">
              ⚠️ Mizanım, hukuki bilgi sunmaktadır; hukuki tavsiye, danışmanlık veya avukatlık
              hizmeti vermemektedir.
            </p>
            <p className="mt-2">
              Platform üzerinden elde edilen bilgiler genel nitelikte olup, kişisel hukuki durumunuza
              özgü tavsiye niteliği taşımaz. Hukuki bir uyuşmazlıkta mutlaka bir avukata danışmanız
              önerilmektedir. Mizanım&apos;ın sunduğu bilgilere dayanılarak yapılan işlemler sonucunda
              doğabilecek zararlardan Mizanım sorumlu tutulamaz.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">3. Kullanıcı Sorumlulukları</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kayıt esnasında doğru bilgi vermek</li>
              <li>Hesap güvenliğini sağlamak, şifreyi üçüncü kişilerle paylaşmamak</li>
              <li>Platformu yalnızca yasal amaçlarla kullanmak</li>
              <li>Başka kullanıcıların verilerine yetkisiz erişim girişiminde bulunmamak</li>
              <li>Sistemi aşırı yükleme, saldırı veya spam amaçlı kullanmamak</li>
              <li>Avukat hesabı için baro kaydının güncel ve geçerli olması</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">4. Fikri Mülkiyet</h2>
            <p>
              Platform tasarımı, yazılımı, içerikleri ve marka unsurları Mizanım&apos;a aittir ve telif
              hukuku ile fikri mülkiyet mevzuatıyla korunmaktadır. Kullanıcılar, Platform üzerinden
              erişilen içerikleri ticari amaçla kopyalayamaz, dağıtamaz veya değiştiremez.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">5. Hesap Askıya Alma</h2>
            <p>Aşağıdaki durumlarda hesabınız askıya alınabilir veya silinebilir:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kullanım şartlarının ihlali</li>
              <li>Sahte veya yanıltıcı bilgi ile kayıt</li>
              <li>Avukat hesabı için baro kaydının iptali</li>
              <li>Ödeme yükümlülüklerinin yerine getirilmemesi</li>
              <li>Güvenlik ihlali girişimi</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">6. Uygulanacak Hukuk</h2>
            <p>
              Bu kullanım şartları Türkiye Cumhuriyeti hukukuna tabidir. Anlaşmazlıklarda
              İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">7. İletişim</h2>
            <p>
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
