import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { title: "Gizlilik Politikası | Mizanım" };

export default function GizlilikPolitikasiPage() {
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
        <h1 className="font-heading text-3xl font-bold text-primary mb-2">Gizlilik Politikası</h1>
        <p className="text-sm text-muted-foreground mb-8">Son güncelleme: 1 Ocak 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">KVKK Aydınlatma Metni</h2>
            <p>
              Mizanım (&quot;Platform&quot;), 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında
              veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaç ve hukuki sebeplerle
              işlemektedir.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">1. İşlenen Kişisel Veriler</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kimlik bilgileri: Ad, soyad, TC kimlik numarası (UYAP entegrasyonu için)</li>
              <li>İletişim bilgileri: E-posta adresi, telefon numarası</li>
              <li>Mesleki bilgiler (Avukat kullanıcılar): Baro sicil numarası, baro adı</li>
              <li>Kullanım verileri: Platform içi işlemler, sohbet geçmişi, yüklenen belgeler</li>
              <li>Finansal veriler: Ödeme kayıtları (kart bilgileri Mizanım sistemlerinde saklanmaz)</li>
              <li>Teknik veriler: IP adresi, tarayıcı bilgisi, oturum logları</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">2. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Hizmet sunumu ve hesap yönetimi — KVKK m.5/2-c (sözleşmenin ifası)</li>
              <li>Hukuki yükümlülüklerin yerine getirilmesi — KVKK m.5/2-ç</li>
              <li>Platform güvenliğinin sağlanması — KVKK m.5/2-f (meşru menfaat)</li>
              <li>AI hizmetlerinin iyileştirilmesi — açık rıza (KVKK m.5/1)</li>
              <li>Faturalandırma ve muhasebe — KVKK m.5/2-ç</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">3. Kişisel Verilerin Aktarılması</h2>
            <p>
              Kişisel verileriniz; hizmet altyapısı sağlayıcıları (Supabase — veri tabanı, Vercel — hosting,
              Anthropic — AI işleme), ödeme altyapısı (iyzico), e-posta hizmetleri (Resend) ile
              KVKK m.8 kapsamında yurt içinde; gerekli teknik altyapı için KVKK m.9 kapsamında
              yurt dışında açık rıza ve/veya yasal düzenlemeler çerçevesinde paylaşılabilir.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">4. Veri Sahibinin Hakları (KVKK m.11)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içi veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
              <li>Eksik veya yanlış verilerin düzeltilmesini isteme</li>
              <li>KVKK m.7 kapsamında silinmesini veya yok edilmesini isteme</li>
              <li>Otomatik sistemler aracılığıyla aleyhinize sonuç doğuran işlemlere itiraz etme</li>
              <li>Zarara uğramanız halinde tazminat talep etme</li>
            </ul>
            <p className="mt-2">
              Haklarınızı kullanmak için{" "}
              <a href="mailto:kvkk@mizanim.com" className="text-accent hover:underline">kvkk@mizanim.com</a>{" "}
              adresine yazılı başvurabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">5. Veri Güvenliği</h2>
            <p>
              Kişisel verileriniz, TLS/SSL şifrelemesi, güvenli veri tabanı altyapısı ve erişim
              kontrol mekanizmaları ile korunmaktadır. Şifreniz asla açık metin olarak saklanmaz;
              Supabase&apos;in güvenli kimlik doğrulama altyapısı kullanılmaktadır.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">6. Çerezler</h2>
            <p>
              Platform, oturum yönetimi ve performans ölçümü amacıyla çerezler kullanmaktadır.
              Detaylar için <Link href="/cerez-politikasi" className="text-accent hover:underline">Çerez Politikası</Link>&apos;nı inceleyiniz.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">7. İletişim</h2>
            <p>
              Gizlilik politikamıza ilişkin sorularınız için:{" "}
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
