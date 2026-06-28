"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Search,
  BookOpen,
  FileText,
  MessageSquare,
  FolderOpen,
  Users,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

interface Props {
  lawyerName: string;
}

const ANA_MENU = [
  { href: "/buro", label: "Ana Sayfa", icon: LayoutDashboard, exact: true },
  { href: "/buro/emsal", label: "Karar Arama", icon: Search, ai: true },
  { href: "/buro/mevzuat", label: "Mevzuat Arama", icon: BookOpen },
  { href: "/buro/dilekce", label: "Dilekçe İşlemleri", icon: FileText, ai: true },
  { href: "/buro/asistan", label: "MizanAI", icon: MessageSquare, ai: true },
];

const YONETIM_MENU = [
  { href: "/buro/davalar", label: "Dosya Yönetimi", icon: FolderOpen },
  { href: "/buro/muvekkiller", label: "Müvekkiller", icon: Users },
  { href: "/buro/finans", label: "Finansal İşlemler", icon: TrendingUp },
];

const ORGANIZASYON_MENU = [
  { href: "/buro/takvim", label: "Takvim & Görevler", icon: Calendar },
];

export default function BuroLeftSidebar({ lawyerName }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const initials = lawyerName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <aside
      className={`flex flex-col bg-[#0f1729] border-r border-white/5 transition-all duration-300 flex-shrink-0 h-screen sticky top-0 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-[#0f1729]">
          <Image src="/logo.png" alt="Mizanım" width={32} height={32} className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-bold text-white leading-tight">Mizanım</p>
            <p className="text-[10px] text-white/30">Hukuk Asistanı</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-hidden py-2 px-2 space-y-2">
        {/* Ana Menü */}
        <div>
          {!collapsed && (
            <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-1">
              ANA MENÜ
            </p>
          )}
          <div className="space-y-0.5">
            {ANA_MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-[#c9a84c]/15 text-[#c9a84c]"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!collapsed && item.ai && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-semibold flex-shrink-0">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Yönetim */}
        <div>
          {!collapsed && (
            <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-1">
              YÖNETİM
            </p>
          )}
          <div className="space-y-0.5">
            {YONETIM_MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-[#c9a84c]/15 text-[#c9a84c]"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Organizasyon */}
        <div>
          {!collapsed && (
            <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-1">
              ORGANİZASYON
            </p>
          )}
          <div className="space-y-0.5">
            {ORGANIZASYON_MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-[#c9a84c]/15 text-[#c9a84c]"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Kullanıcı */}
      <div className="border-t border-white/5 p-3 flex-shrink-0">
        <div className={`flex items-center gap-2.5 mb-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#c9a84c]">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">Av. {lawyerName}</p>
              <p className="text-[10px] text-white/30">Avukat</p>
            </div>
          )}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Çıkış Yap"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-colors text-xs ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && "Çıkış Yap"}
          </button>
        </form>
      </div>
    </aside>
  );
}
