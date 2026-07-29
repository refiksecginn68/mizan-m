"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Film,
  Search,
  FileText,
  Calculator,
  Settings,
  LogOut,
  Sparkles,
  Pin,
  PinOff,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

interface Props {
  lawyerName: string;
  monthlyQueryLimit?: number;
  monthlyQueryCount?: number;
  additionalQueries?: number;
}

// 8 üst başlık — nihai bilgi mimarisi. Grup başlıkları ilk sekmesine gider;
// alt sayfalar grup sayfalarındaki BuroTabBar ile gezilir. "match" bir başlığın
// hangi route'larda aktif görüneceğini belirler.
const MENU = [
  { href: "/buro", label: "Panel", icon: LayoutDashboard, exact: true, match: ["/buro"] },
  { href: "/buro/davalar", label: "Dosya Yönetimi", icon: FolderOpen, match: ["/buro/davalar", "/buro/muvekkiller", "/buro/finans", "/buro/dava"] },
  { href: "/buro/uyap", label: "UYAP & Tebligat", icon: Building2, match: ["/buro/uyap", "/buro/tebligat"] },
  { href: "/buro/medya", label: "Medya & Delil", icon: Film, match: ["/buro/medya"] },
  { href: "/buro/emsal", label: "Araştırma", icon: Search, ai: true, match: ["/buro/emsal", "/buro/mevzuat"] },
  { href: "/buro/dilekce", label: "Dilekçe & AI", icon: FileText, ai: true, match: ["/buro/dilekce"] },
  { href: "/buro/hesaplama", label: "Hesaplama & Dönüştürücü", icon: Calculator, match: ["/buro/hesaplama"] },
  { href: "/buro/profil", label: "Ayarlar", icon: Settings, match: ["/buro/profil", "/buro/ayarlar"] },
];

const PIN_KEY = "buro-sidebar-pinned";

export default function BuroLeftSidebar({
  lawyerName,
  monthlyQueryLimit = 0,
  monthlyQueryCount = 0,
  additionalQueries = 0,
}: Props) {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pin tercihi kalıcı (mevcut kullanıcı ayar mekanizması yok → localStorage).
  useEffect(() => {
    setPinned(localStorage.getItem(PIN_KEY) === "1");
  }, []);

  const expanded = pinned || hovered;

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHovered(true);
  }
  // Ayrılınca ~300ms gecikme — flicker'ı önler.
  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovered(false), 300);
  }
  function togglePin() {
    const next = !pinned;
    setPinned(next);
    localStorage.setItem(PIN_KEY, next ? "1" : "0");
  }

  const totalQueries = monthlyQueryLimit + additionalQueries;
  const remainingQueries = Math.max(0, totalQueries - monthlyQueryCount);

  function isActive(item: { href: string; exact?: boolean; match: string[] }) {
    if (item.exact) return pathname === item.href;
    return item.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
  }

  const initials = lawyerName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Akışta yer tutan boşluk: pinliyken içerik daralır (w-56), değilken dar rail
          (w-16) kalır ve genişleme overlay olur — içerik oynamaz. */}
      <div
        aria-hidden
        className={`hidden lg:block flex-shrink-0 transition-[width] duration-200 ${pinned ? "w-56" : "w-16"}`}
      />

      <aside
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        onFocusCapture={openNow}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) closeSoon();
        }}
        aria-expanded={expanded}
        className={`hidden lg:flex flex-col bg-[#0f1729] border-r border-white/5 transition-[width] duration-200 ease-in-out fixed left-0 top-0 h-screen z-40 overflow-hidden ${
          expanded ? "w-56" : "w-16"
        }`}
      >
        {/* Logo + pin */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-[#0f1729]">
            <Image src="/logo.png" alt="Mizanım" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div className={`min-w-0 transition-opacity duration-200 ${expanded ? "flex-1 opacity-100" : "w-0 opacity-0 overflow-hidden"}`}>
            <p className="font-heading text-sm font-bold text-white leading-tight whitespace-nowrap">Mizanım</p>
            <p className="text-[10px] text-white/30 whitespace-nowrap">Hukuk Asistanı</p>
          </div>
          <button
            onClick={togglePin}
            title={pinned ? "Sabitlemeyi kaldır" : "Menüyü sabitle"}
            aria-label={pinned ? "Menü sabitlemesini kaldır" : "Menüyü sabitle"}
            className={`ml-auto text-white/30 hover:text-white/70 transition-all flex-shrink-0 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
          >
            {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav — 8 başlık */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2 space-y-0.5">
          {MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!expanded ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-[#c9a84c]/15 text-[#c9a84c]" : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className={`truncate transition-opacity duration-200 ${expanded ? "flex-1 opacity-100" : "w-0 opacity-0 overflow-hidden"}`}>
                  {item.label}
                </span>
                {item.ai && (
                  <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-semibold flex-shrink-0 transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 px-0 overflow-hidden"}`}>
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Kullanıcı */}
        <div className="border-t border-white/5 p-3 flex-shrink-0">
          <Link
            href="/buro/profil"
            title="Profilim"
            className={`flex items-center gap-2.5 mb-2 rounded-xl px-1 py-1 hover:bg-white/5 transition-colors ${expanded ? "" : "justify-center"}`}
          >
            <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#c9a84c]">{initials}</span>
            </div>
            <div className={`min-w-0 transition-opacity duration-200 ${expanded ? "flex-1 opacity-100" : "w-0 opacity-0 overflow-hidden"}`}>
              <p className="text-xs font-semibold text-white truncate">Av. {lawyerName}</p>
              <p className="text-[10px] text-accent font-semibold mt-0.5 whitespace-nowrap">
                Sorgu: {remainingQueries} / {totalQueries}
              </p>
            </div>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Çıkış Yap"
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-colors text-xs ${expanded ? "" : "justify-center"}`}
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              {expanded && "Çıkış Yap"}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
