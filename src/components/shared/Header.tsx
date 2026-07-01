"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/shared/Logo";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo href="/" size={32} textClass="font-heading text-xl font-bold text-white tracking-wide" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/#fiyatlandirma"
              className="font-body text-sm text-white/80 hover:text-accent transition-colors"
            >
              Fiyatlandırma
            </Link>
            <Link
              href="/#ozellikler"
              className="font-body text-sm text-white/80 hover:text-accent transition-colors"
            >
              Özellikler
            </Link>
            <Link
              href="/#nasil-calisir"
              className="font-body text-sm text-white/80 hover:text-accent transition-colors"
            >
              Nasıl Çalışır?
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/giris"
              className="font-body text-sm text-white/90 hover:text-white transition-colors px-4 py-2"
            >
              Giriş Yap
            </Link>
            <Link
              href="/kayit"
              className="btn-accent text-sm py-2 px-5"
            >
              Ücretsiz Başla
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menü"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-primary border-t border-white/10 animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/#fiyatlandirma"
              className="block font-body text-white/80 hover:text-accent py-2 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Fiyatlandırma
            </Link>
            <Link
              href="/#ozellikler"
              className="block font-body text-white/80 hover:text-accent py-2 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Özellikler
            </Link>
            <Link
              href="/#nasil-calisir"
              className="block font-body text-white/80 hover:text-accent py-2 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Nasıl Çalışır?
            </Link>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/giris"
                className="block text-center btn-outline border-white text-white hover:bg-white hover:text-primary py-2"
                onClick={() => setMenuOpen(false)}
              >
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className="block text-center btn-accent py-2"
                onClick={() => setMenuOpen(false)}
              >
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
