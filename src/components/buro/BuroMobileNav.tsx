"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FolderOpen,
  Calendar,
  MessageSquare,
} from "lucide-react";

const MOBILE_NAV = [
  { href: "/buro", label: "Ana Sayfa", icon: LayoutDashboard, exact: true },
  { href: "/buro/emsal", label: "Emsal", icon: Search },
  { href: "/buro/davalar", label: "Dosyalar", icon: FolderOpen },
  { href: "/buro/takvim", label: "Takvim", icon: Calendar },
  { href: "/buro/asistan", label: "AI", icon: MessageSquare },
];

export default function BuroMobileNav() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f1729] border-t border-white/5 flex items-center justify-around h-14 px-2">
      {MOBILE_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-colors ${
              active ? "text-[#c9a84c]" : "text-white/40 hover:text-white/70"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
