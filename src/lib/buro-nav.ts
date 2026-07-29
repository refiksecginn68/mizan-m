// Büro (avukat) bilgi mimarisi — tek kaynak.
// Sekme grupları hem sol menüde (BuroLeftSidebar) hem de grup sayfalarındaki
// sekme çubuğunda (BuroTabBar) kullanılır. Yeni sekme eklerken sadece burayı düzenle.

export interface BuroTab {
  href: string;
  label: string;
}

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
