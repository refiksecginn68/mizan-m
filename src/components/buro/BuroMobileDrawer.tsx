"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { BURO_MENU, type BuroMenuItem } from "@/lib/buro-nav";

// Mobil üst bar + hamburger ile açılan off-canvas menü. Sadece <lg görünür.
// Menü dizisi sidebar ile ORTAK (BURO_MENU) — ikinci bir liste yok.
export default function BuroMobileDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Route değişince kapan (link tıklaması sonrası).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Açıkken: gövde kaydırmasını kilitle, ESC ile kapat, odağı drawer'a hapset,
  // kapanınca odağı tetikleyiciye geri ver.
  useEffect(() => {
    if (!open) return;
    const tetikleyici = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const odaklanabilirler = () =>
      panelRef.current
        ? Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled])'
            )
          )
        : [];

    odaklanabilirler()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const items = odaklanabilirler();
        if (items.length === 0) return;
        const ilk = items[0];
        const son = items[items.length - 1];
        if (e.shiftKey && document.activeElement === ilk) {
          e.preventDefault();
          son.focus();
        } else if (!e.shiftKey && document.activeElement === son) {
          e.preventDefault();
          ilk.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      tetikleyici?.focus();
    };
  }, [open]);

  function isActive(item: BuroMenuItem) {
    if (item.exact) return pathname === item.href;
    return item.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
  }

  return (
    <>
      {/* Mobil üst bar — sadece <lg. Akışta yer tutar (sticky), fixed bottom nav'ın eşi. */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-2.5 h-12 px-3 bg-[#0f1729] border-b border-white/5">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menüyü aç"
          aria-expanded={open}
          aria-controls="buro-mobil-menu"
          className="text-white/70 hover:text-white p-1.5 -ml-1.5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Image src="/logo.png" alt="" width={24} height={24} className="w-6 h-6 rounded-md object-cover" />
        <span className="font-heading text-sm font-bold text-white">Mizanım</span>
      </div>

      {/* Off-canvas drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop — dışına tıkla kapat */}
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div
            ref={panelRef}
            id="buro-mobil-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Ana menü"
            className="absolute left-0 top-0 h-full w-64 max-w-[82%] bg-[#0f1729] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between h-12 px-3 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="" width={24} height={24} className="w-6 h-6 rounded-md object-cover" />
                <span className="font-heading text-sm font-bold text-white">Mizanım</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Menüyü kapat"
                className="text-white/60 hover:text-white p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5" aria-label="Ana menü bağlantıları">
              {BURO_MENU.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#c9a84c]/15 text-[#c9a84c]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.ai && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-semibold flex-shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
