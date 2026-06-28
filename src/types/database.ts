export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserType = "avukat" | "vatandas";
export type CaseStatus = "aktif" | "kapatildi" | "arsiv";
export type DocumentType = "sozlesme" | "karar" | "dilekce" | "ihtarname" | "diger";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial";
export type SubscriptionPlan = "baslangic" | "profesyonel" | "buro";
export type LegislationSource = "kanun" | "yonetmelik" | "teblig" | "anayasa";
export type CaseLawSource = "yargitay" | "danistay" | "aym" | "bam" | "diger";
export type EmbeddingSourceType = "kanun" | "karar" | "anayasa";
export type NotificationType = "durusma" | "tebligat" | "sure" | "sistem" | "kredi";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          user_type: UserType;
          avatar_url: string | null;
          phone: string | null;
          bar_number: string | null;
          bar_city: string | null;
          credit_balance: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at" | "credit_balance" | "is_active"> & {
          credit_balance?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      law_areas: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          description: string | null;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["law_areas"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["law_areas"]["Insert"]>;
      };
      credit_packages: {
        Row: {
          id: string;
          name: string;
          credits: number;
          price_try: number;
          is_popular: boolean;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_packages"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["credit_packages"]["Insert"]>;
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: SubscriptionPlan;
          price_monthly: number;
          price_yearly: number;
          features: Json;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["subscription_plans"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["subscription_plans"]["Insert"]>;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: "spend" | "purchase" | "bonus" | "refund";
          description: string;
          reference_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_transactions"]["Row"], "id" | "created_at">;
        Update: never;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          started_at: string;
          expires_at: string | null;
          cancelled_at: string | null;
          payment_provider: string | null;
          provider_subscription_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: PaymentStatus;
          provider: string;
          provider_payment_id: string | null;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          lawyer_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          tc_no: string | null;
          address: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at" | "updated_at" | "is_active">;
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      cases: {
        Row: {
          id: string;
          lawyer_id: string;
          client_id: string | null;
          title: string;
          case_number: string | null;
          court: string | null;
          law_area_id: string | null;
          status: CaseStatus;
          description: string | null;
          opposing_party: string | null;
          notes: string | null;
          opened_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cases"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
      };
      case_documents: {
        Row: {
          id: string;
          case_id: string;
          lawyer_id: string;
          name: string;
          storage_path: string;
          file_type: string;
          file_size: number;
          ai_summary: string | null;
          ai_risks: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["case_documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["case_documents"]["Insert"]>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          law_area_id: string | null;
          case_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sessions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          sources: Json | null;
          credit_cost: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at">;
        Update: never;
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          storage_path: string;
          file_type: string;
          file_size: number;
          ai_summary: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      generated_documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          document_type: string;
          content: string;
          pdf_path: string | null;
          docx_path: string | null;
          law_area_id: string | null;
          credit_cost: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["generated_documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["generated_documents"]["Insert"]>;
      };
      legislation: {
        Row: {
          id: string;
          title: string;
          number: string | null;
          source: LegislationSource;
          content: string;
          article_number: string | null;
          law_area_id: string | null;
          published_at: string | null;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["legislation"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["legislation"]["Insert"]>;
      };
      case_laws: {
        Row: {
          id: string;
          court: string;
          source: CaseLawSource;
          case_number: string;
          decision_number: string | null;
          decision_date: string | null;
          subject: string;
          summary: string;
          full_text: string | null;
          law_area_id: string | null;
          keywords: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["case_laws"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["case_laws"]["Insert"]>;
      };
      law_embeddings: {
        Row: {
          id: string;
          source_type: EmbeddingSourceType;
          source_id: string;
          content_chunk: string;
          embedding: number[];
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["law_embeddings"]["Row"], "id" | "created_at">;
        Update: never;
      };
      calendar_events: {
        Row: {
          id: string;
          lawyer_id: string;
          case_id: string | null;
          client_id: string | null;
          title: string;
          description: string | null;
          event_type: "durusma" | "toplanti" | "sure" | "diger";
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          is_reminder_sent: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["calendar_events"]["Row"], "id" | "created_at" | "is_reminder_sent">;
        Update: Partial<Database["public"]["Tables"]["calendar_events"]["Insert"]>;
      };
      tebligat_records: {
        Row: {
          id: string;
          lawyer_id: string;
          case_id: string | null;
          uets_id: string | null;
          sender: string;
          subject: string;
          received_at: string;
          deadline_at: string | null;
          is_processed: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tebligat_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tebligat_records"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          is_read: boolean;
          reference_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at" | "is_read">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
    Functions: {
      spend_credits: {
        Args: { p_user_id: string; p_amount: number; p_description: string; p_reference_id?: string };
        Returns: boolean;
      };
      add_credits: {
        Args: { p_user_id: string; p_amount: number; p_description: string; p_reference_id?: string };
        Returns: boolean;
      };
      semantic_search: {
        Args: { query_embedding: number[]; source_type_filter?: string; match_threshold?: number; match_count?: number };
        Returns: { id: string; source_type: string; source_id: string; content_chunk: string; similarity: number; metadata: Json }[];
      };
    };
    Enums: Record<string, never>;
  };
}
