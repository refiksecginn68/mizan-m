// Büro (avukat) bilgi mimarisi — tek kaynak.
// Sekme grupları hem sol menüde (BuroLeftSidebar) hem de grup sayfalarındaki
// sekme çubuğunda (BuroTabBar) kullanılır. Yeni sekme eklerken sadece burayı düzenle.
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Film,
  Search,
  FileText,
  Calculator,
  Settings,
  MessageSquare,
} from "lucide-react";

export interface BuroTab {
  href: string;
  label: string;
}

// 8 üst başlık — nihai bilgi mimarisi (tek kaynak). Hem sol menü (BuroLeftSidebar)
// hem de mobil off-canvas drawer (BuroMobileDrawer) bu diziyi render eder.
// "match": başlığın hangi route'larda aktif görüneceği. "ai": AI rozeti.
export interface BuroMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
  exact?: boolean;
  ai?: boolean;
}

export const BURO_MENU: BuroMenuItem[] = [
  { href: "/buro", label: "Panel", icon: LayoutDashboard, exact: true, match: ["/buro"] },
  { href: "/buro/davalar", label: "Dosya Yönetimi", icon: FolderOpen, match: ["/buro/davalar", "/buro/muvekkiller", "/buro/finans", "/buro/dava"] },
  { href: "/buro/uyap", label: "UYAP & Tebligat", icon: Building2, match: ["/buro/uyap", "/buro/tebligat"] },
  { href: "/buro/medya", label: "Medya & Delil", icon: Film, match: ["/buro/medya"] },
  { href: "/buro/emsal", label: "Araştırma", icon: Search, ai: true, match: ["/buro/emsal", "/buro/mevzuat"] },
  { href: "/buro/mizanai", label: "MizanAI", icon: MessageSquare, ai: true, match: ["/buro/mizanai", "/buro/asistan"] },
  { href: "/buro/dilekce", label: "Dilekçe & AI", icon: FileText, ai: true, match: ["/buro/dilekce"] },
  { href: "/buro/hesaplama", label: "Hesaplama & Dönüştürücü", icon: Calculator, match: ["/buro/hesaplama"] },
  { href: "/buro/profil", label: "Ayarlar", icon: Settings, match: ["/buro/profil", "/buro/ayarlar"] },
];

export const BURO_TABS = {
  // 2. Dosya Yönetimi
  dosya: [
    { href: "/buro/davalar", label: "Dosyalar" },
    { href: "/buro/muvekkiller", label: "Müvekkiller" },
    { href: "/buro/finans", label: "Finansal İşlemler" },
  ] as BuroTab[],
  // 3. UYAP & Tebligat
  uyapTebligat: [
    { href: "/buro/uyap", label: "UYAP Senkron" },
    { href: "/buro/tebligat", label: "E-Tebligat" },
  ] as BuroTab[],
  // 5. Araştırma
  arastirma: [
    { href: "/buro/emsal", label: "Emsal Arama" },
    { href: "/buro/mevzuat", label: "Mevzuat Arama" },
  ] as BuroTab[],
};
