"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BuroTab } from "@/lib/buro-nav";

// Grup sayfalarının üstünde yatay, dar ekranda kaydırılabilir sekme çubuğu.
// Aktif sekme geçerli route'a göre belirlenir — durum URL'de, yenilemeye dayanıklı,
// paylaşılabilir. Rol kontrolü her sayfanın kendi guard'ında korunur.
export default function BuroTabBar({ items }: { items: BuroTab[] }) {
  const pathname = usePathname();

  return (
    <div className="bg-[#f4f5f7] border-b border-gray-200/60 px-4 sm:px-6">
      <nav
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px"
        aria-label="Bölüm sekmeleri"
      >
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-[#c9a84c] text-[#0f1729]"
                  : "border-transparent text-gray-500 hover:text-[#0f1729] hover:border-gray-300"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
