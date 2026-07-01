"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FolderOpen, Calendar, TrendingUp, MessageSquare, LogOut, User, Building2, Mail, Film, BookOpen } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import Logo from "@/components/shared/Logo";

interface BuroHeaderProps {
  lawyerName: string;
}

const navItems = [
  { href: "/buro/muvekkiller", label: "Müvekkiller", icon: Users },
  { href: "/buro/davalar", label: "Davalar", icon: FolderOpen },
  { href: "/buro/takvim", label: "Takvim", icon: Calendar },
  { href: "/buro/finans", label: "Finans", icon: TrendingUp },
  { href: "/buro/asistan", label: "Asistan", icon: MessageSquare },
  { href: "/buro/uyap", label: "UYAP", icon: Building2 },
  { href: "/buro/tebligat", label: "Tebligat", icon: Mail },
  { href: "/buro/medya", label: "Medya", icon: Film },
  { href: "/buro/emsal", label: "Emsal", icon: BookOpen },
];

export default function BuroHeader({ lawyerName }: BuroHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="bg-primary shadow-elevated sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14 border-b border-white/10">
          <Logo href="/buro" size={28} subtitle="Büro Yönetimi" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-white/50" />
              <span className="font-body text-xs text-white/70 hidden sm:block">
                Av. {lawyerName}
              </span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-white/50 hover:text-white transition-colors p-1.5"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide h-10">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-accent/20 text-accent"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
