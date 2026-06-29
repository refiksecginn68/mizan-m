"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, CreditCard, User, LogOut, MessageSquare, FileText, Search, BookOpen, Building2 } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

interface VatandasHeaderProps {
  fullName?: string;
  userName?: string;
  creditBalance?: number;
  credits?: number;
}

const NAV_ITEMS = [
  { href: "/asistan", label: "Asistan", icon: MessageSquare },
  { href: "/belgelerim", label: "Belgelerim", icon: FileText },
  { href: "/emsal", label: "Emsal", icon: Search },
  { href: "/uretilen-belgeler", label: "Dilekçelerim", icon: BookOpen },
  { href: "/uyap", label: "UYAP", icon: Building2 },
];

export default function VatandasHeader({ fullName, userName, creditBalance, credits }: VatandasHeaderProps) {
  const pathname = usePathname();
  const displayName = fullName ?? userName ?? "";
  const balance = creditBalance ?? credits ?? 0;

  return (
    <header className="bg-primary shadow-elevated sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/panel" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading text-base font-bold text-white">Mizanım</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                    active
                      ? "bg-accent/20 text-accent"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <Link
              href="/kredi"
              className="flex items-center gap-1.5 bg-accent/20 border border-accent/40 rounded-lg px-2.5 py-1 hover:bg-accent/30 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-accent" />
              <span className="font-body text-xs font-bold text-accent">{balance}</span>
            </Link>
            {displayName && (
              <Link href="/profil" className="hidden sm:flex items-center gap-1.5 hover:opacity-80 transition-opacity" title="Profilim">
                <User className="w-3.5 h-3.5 text-white/50" />
                <span className="font-body text-xs text-white/70">{displayName.split(" ")[0]}</span>
              </Link>
            )}
            <form action={logoutAction}>
              <button type="submit" className="text-white/50 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body whitespace-nowrap transition-colors ${
                  active
                    ? "bg-accent/20 text-accent"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
