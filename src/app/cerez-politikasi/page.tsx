import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { title: "Çerez Politikası | Mizanım" };

export default function CerezPolitikasiPage() {
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
        <h1 className="font-heading text-3xl font-bold text-primary mb-2">Çerez Politikası</h1>
        <p className="text-sm text-muted-foreground mb-8">Son güncelleme: 1 Ocak 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">Çerez Nedir?</h2>
            <p>
              Çerezler, tarayıcınız aracılığıyla cihazınıza yerleştirilen küçük metin dosyalarıdır.
              Mizanım, hizmet kalitesini artırmak ve kişiselleştirilmiş deneyim sunmak amacıyla
              çerezler kullanmaktadır.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">Kullanılan Çerez Türleri</h2>

            <h3 className="font-semibold text-base mb-2">Zorunlu Çerezler</h3>
            <p>Platformun çalışması için gereklidir. Reddedilemez.</p>
            <ul className="list-disc pl-6 space-y-1 mt-1">
              <li><code>sb-*</code> — Supabase oturum yönetimi (kimlik doğrulama)</li>
              <li><code>cookie-consent</code> — Çerez tercihinizin kaydı</li>
            </ul>

            <h3 className="font-semibold text-base mb-2 mt-4">Analitik Çerezler</h3>
            <p>Kullanım istatistiklerini ölçmek amacıyla kullanılır. Onayınızla etkinleşir.</p>
            <ul className="list-disc pl-6 space-y-1 mt-1">
              <li>Sayfa görüntüleme ve kullanım analizi verileri</li>
              <li>Hata izleme ve performans ölçümü</li>
            </ul>

            <h3 className="font-semibold text-base mb-2 mt-4">Pazarlama Çerezleri</h3>
            <p>Kişiselleştirilmiş içerik sunmak amacıyla kullanılır. Onayınızla etkinleşir.</p>
            <ul className="list-disc pl-6 space-y-1 mt-1">
              <li>Kullanıcı tercihlerini hatırlamak için tercih çerezleri</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">Üçüncü Taraf Çerezler</h2>
            <p>
              Ödeme altyapısı sağlayıcısı iyzico, ödeme sayfalarında kendi güvenlik çerezlerini
              kullanmaktadır. Bu çerezler iyzico&apos;nun gizlilik politikasına tabidir.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">Çerez Yönetimi</h2>
            <p>
              Tarayıcı ayarlarınızdan tüm çerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu
              çerezlerin engellenmesi durumunda giriş ve oturum yönetimi işlevleri çalışmayabilir.
            </p>
            <p className="mt-2">
              Çerez tercihlerinizi Platform ana sayfasındaki çerez bandı üzerinden de güncelleyebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">İletişim</h2>
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
