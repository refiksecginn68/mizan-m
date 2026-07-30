"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Film,
  Search,
  FileText,
} from "lucide-react";

// Bottom bar: en sık kullanılan 6 başlığın kısayolu. Tüm başlıklara (Hesaplama,
// Ayarlar dâhil) erişim mobil üst bardaki hamburger → BuroMobileDrawer'dan sağlanır.
const MOBILE_NAV = [
  { href: "/buro", label: "Panel", icon: LayoutDashboard, exact: true, match: ["/buro"] },
  { href: "/buro/davalar", label: "Dosya", icon: FolderOpen, match: ["/buro/davalar", "/buro/muvekkiller", "/buro/finans", "/buro/dava"] },
  { href: "/buro/uyap", label: "UYAP", icon: Building2, match: ["/buro/uyap", "/buro/tebligat"] },
  { href: "/buro/medya", label: "Delil", icon: Film, match: ["/buro/medya"] },
  { href: "/buro/emsal", label: "Araştır", icon: Search, match: ["/buro/emsal", "/buro/mevzuat"] },
  { href: "/buro/dilekce", label: "Dilekçe", icon: FileText, match: ["/buro/dilekce"] },
];

export default function BuroMobileNav() {
  const pathname = usePathname();

  function isActive(item: { exact?: boolean; match: string[] }) {
    if (item.exact) return pathname === "/buro";
    return item.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f1729] border-t border-white/5 flex items-center justify-around h-14 px-2">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-colors ${
              active ? "text-[#c9a84c]" : "text-white/40 hover:text-white/70"
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
