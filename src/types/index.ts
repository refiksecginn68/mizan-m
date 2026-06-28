export type UserType = "avukat" | "vatandas";

export interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  avatar_url?: string;
  phone?: string;
  bar_number?: string;
  created_at: string;
}

export interface CreditBalance {
  balance: number;
  total_spent: number;
}

export interface SubscriptionStatus {
  plan: "baslangic" | "profesyonel" | "buro" | null;
  status: "active" | "cancelled" | "expired" | null;
  expires_at: string | null;
}

export interface LawArea {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface CreditCost {
  basit_soru: 1;
  emsal_arastirma: 3;
  belge_analizi: 5;
  dilekce_uretimi: 8;
  savunma_sozlesme: 10;
  medya_analizi: 7;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: LegalSource[];
  credit_cost?: number;
  created_at: string;
}

export interface LegalSource {
  type: "kanun" | "karar" | "anayasa";
  title: string;
  article?: string;
  case_number?: string;
  date?: string;
  court?: string;
  url?: string;
}

export interface Session {
  id: string;
  user_id: string;
  title: string;
  law_area?: string;
  created_at: string;
  updated_at: string;
}
