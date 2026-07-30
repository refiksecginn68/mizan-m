// Ana sayfa favori kısayol kataloğu — TEK KAYNAK.
// key sabittir (Supabase profiles.dashboard_favorites text[] ile eşleşir).
import type { LucideIcon } from "lucide-react";
import {
  Scale,
  BookOpen,
  FileText,
  MessageSquare,
  FolderOpen,
  Calendar,
  TrendingUp,
  Building2,
} from "lucide-react";

export interface FavoriKart {
  key: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  route: string;
}

export const FAVORI_KATALOG: FavoriKart[] = [
  { key: "karar-arama", label: "Karar Arama", sublabel: "İçtihat & emsal", icon: Scale, route: "/buro/emsal" },
  { key: "mevzuat-arama", label: "Mevzuat Arama", sublabel: "Güncel kanunlar", icon: BookOpen, route: "/buro/mevzuat" },
  { key: "yeni-dilekce", label: "Yeni Dilekçe", sublabel: "AI destekli", icon: FileText, route: "/buro/dilekce" },
  { key: "mizanai", label: "MizanAI", sublabel: "Hukuki asistan", icon: MessageSquare, route: "/buro/mizanai" },
  { key: "dosyalarim", label: "Dosyalarım", sublabel: "Dava dosyaları", icon: FolderOpen, route: "/buro/davalar" },
  { key: "durusmalarim", label: "Duruşmalarım", sublabel: "Takvim & süreler", icon: Calendar, route: "/buro/takvim" },
  { key: "finans", label: "Finans", sublabel: "Tahsilat & kasa", icon: TrendingUp, route: "/buro/finans" },
  { key: "uyap-aktar", label: "UYAP Aktar", sublabel: "Dosya senkron", icon: Building2, route: "/buro/uyap" },
];

export const VARSAYILAN_FAVORILER = ["mizanai", "yeni-dilekce", "karar-arama", "uyap-aktar"];
export const FAVORI_SAYISI = 4;

const KATALOG_INDEX = new Map(FAVORI_KATALOG.map((k) => [k.key, k]));

// Geçerli key'leri sırayla döndür; yoksa/eksikse varsayılana tamamlar.
export function favorileriCoz(keys: string[] | null | undefined): FavoriKart[] {
  const secili = (keys ?? []).filter((k) => KATALOG_INDEX.has(k));
  const tamam = secili.length === FAVORI_SAYISI
    ? secili
    : [...secili, ...VARSAYILAN_FAVORILER.filter((k) => !secili.includes(k))].slice(0, FAVORI_SAYISI);
  return tamam.map((k) => KATALOG_INDEX.get(k)!);
}

export function gecerliFavoriKey(key: string): boolean {
  return KATALOG_INDEX.has(key);
}
