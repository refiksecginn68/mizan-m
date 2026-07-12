"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import KvkkModal from "@/components/landing/kvkk-modal";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Özellikler", href: "/ozellikler" },
  { label: "Fiyatlandırma", href: "/fiyatlandirma" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
];

// Sabit üst menü: scroll > 50px olunca koyu zemin + blur kazanır.
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sayfa değişince mobil menüyü kapat
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Mobil menü açıkken body scroll kilidi
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const headerBg = scrolled || mobileOpen
    ? "bg-navy-950/90 backdrop-blur-md border-b border-navy-700"
    : "bg-transparent border-b border-transparent";

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${headerBg}`}>
        <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="Mizanım ana sayfa">
            <span className="relative w-10 h-10 rounded-lg overflow-hidden bg-navy-900 ring-1 ring-navy-700 group-hover:ring-gold-500/50 transition-shadow">
              <Image src="/images/logo.png" alt="Mizanım logosu" fill sizes="40px" className="object-cover" />
            </span>
            <span className="font-heading text-lg md:text-xl font-bold text-cream tracking-wide">Mizanım</span>
          </Link>

          {/* Masaüstü menü */}
          <nav aria-label="Ana menü" className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`px-4 py-2 rounded-md font-inter text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500 ${
                    active ? "text-gold-300" : "text-cream/70 hover:text-cream"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Masaüstü CTA'lar */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/giris?role=vatandas"
              className="px-4 py-2 rounded-md font-inter text-sm text-cream/80 border border-navy-700 hover:border-gold-500/50 hover:text-cream transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500"
            >
              Vatandaş Girişi
            </Link>
            <button
              type="button"
              onClick={() => setKvkkOpen(true)}
              className="px-4 py-2 rounded-md font-inter text-sm font-semibold text-navy-950 bg-gold-500 hover:bg-gold-400 transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              Avukat Girişi
            </button>
          </div>

          {/* Mobil hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500 rounded-md"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobil tam ekran menü */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-navy-950/98 backdrop-blur-lg lg:hidden flex flex-col pt-24 px-6 pb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav aria-label="Mobil menü" className="flex flex-col gap-1">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                >
                  <Link
                    href={item.href}
                    className="block py-4 font-heading text-2xl text-cream border-b border-navy-800 hover:text-gold-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={() => { setMobileOpen(false); setKvkkOpen(true); }}
                className="w-full py-3.5 rounded-md font-inter text-base font-semibold text-navy-950 bg-gold-500 hover:bg-gold-400 transition-colors"
              >
                Avukat Girişi
              </button>
              <Link
                href="/giris?role=vatandas"
                className="w-full py-3.5 rounded-md font-inter text-base text-center text-cream border border-navy-700 hover:border-gold-500/50 transition-colors"
              >
                Vatandaş Girişi
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avukat girişi öncesi KVKK bilgilendirme modalı */}
      <KvkkModal open={kvkkOpen} onOpenChange={setKvkkOpen} />
    </>
  );
}
