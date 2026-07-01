import Link from "next/link";
import { Scale } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-xl font-bold">Mizanım</span>
            </Link>
            <p className="font-body text-sm text-white/60 leading-relaxed">
              Türkiye&apos;nin ilk çift kapılı AI hukuk platformu. Avukatlar ve
              vatandaşlar için.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-heading text-sm font-bold text-accent uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/kayit?tip=vatandas", label: "Vatandaş Portalı" },
                { href: "/kayit?tip=avukat", label: "Avukat Portalı" },
                { href: "/fiyatlandirma", label: "Fiyatlandırma" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-body text-sm text-white/60 hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hizmetler */}
          <div>
            <h3 className="font-heading text-sm font-bold text-accent uppercase tracking-wider mb-4">
              Hizmetler
            </h3>
            <ul className="space-y-2">
              {[
                "Emsal Karar Arama",
                "Mevzuat Arama",
                "Belge Analizi",
                "Dilekçe Üretimi",
                "AI Hukuk Asistanı",
              ].map((item) => (
                <li key={item}>
                  <span className="font-body text-sm text-white/60">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h3 className="font-heading text-sm font-bold text-accent uppercase tracking-wider mb-4">
              Yasal
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
                { href: "/kullanim-sartlari", label: "Kullanım Şartları" },
                { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış" },
                { href: "/cerez-politikasi", label: "Çerez Politikası" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-body text-sm text-white/60 hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/40">
            © {new Date().getFullYear()} Mizanım. Tüm hakları saklıdır.
          </p>
          <p className="font-body text-xs text-white/40 text-center">
            ⚠️ Mizanım hukuki bilgi sunar, hukuki tavsiye niteliği taşımaz.
            Hukuki durumunuz için bir avukata danışmanız önerilir.
          </p>
        </div>
      </div>
    </footer>
  );
}
