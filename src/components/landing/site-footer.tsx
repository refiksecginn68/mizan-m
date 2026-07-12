import Link from "next/link";
import Image from "next/image";

// Marka ikonları (lucide 1.x'te kaldırıldığı için inline SVG)
function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Ürün",
    links: [
      { label: "Özellikler", href: "/ozellikler" },
      { label: "Fiyatlandırma", href: "/fiyatlandirma" },
      { label: "Sık Sorulan Sorular", href: "/sss" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "İletişim", href: "/iletisim" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "KVKK Aydınlatma Metni", href: "/kvkk" },
      { label: "Gizlilik Politikası", href: "/gizlilik" },
      { label: "Kullanım Şartları", href: "/kullanim-sartlari" },
      { label: "Yasal Uyarı", href: "/yasal-uyari" },
    ],
  },
];

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: LinkedinIcon },
  { label: "X (Twitter)", href: "https://x.com", icon: XIcon },
  { label: "Instagram", href: "https://www.instagram.com", icon: InstagramIcon },
];

// Kurumsal alt bilgi — 4 sütun + telif satırı
export default function SiteFooter() {
  return (
    <footer className="bg-navy-950 border-t border-navy-800">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Logo + açıklama */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-5" aria-label="Mizanım ana sayfa">
              <span className="relative w-11 h-11 rounded-lg overflow-hidden bg-navy-900 ring-1 ring-navy-700">
                <Image src="/images/logo.png" alt="Mizanım logosu" fill sizes="44px" className="object-cover" />
              </span>
              <span className="font-heading text-xl font-bold text-cream">Mizanım</span>
            </Link>
            <p className="font-inter text-sm text-cream/50 leading-relaxed max-w-sm">
              Türkiye&apos;nin ilk çift portallı yapay zekâ hukuk platformu. Emsal, mevzuat,
              dilekçe, UYAP ve UETS — hepsi tek ekranda. Meslek sırrına ve müvekkil
              mahremiyetine saygıyla.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={`${col.title} bağlantıları`}>
              <h3 className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-gold-500 mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-inter text-sm text-cream/60 hover:text-cream transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500 rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-inter text-xs text-cream/55">
            © 2026 Mizanım. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-md border border-navy-700 flex items-center justify-center text-cream/50 hover:text-gold-300 hover:border-gold-500/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500"
              >
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
