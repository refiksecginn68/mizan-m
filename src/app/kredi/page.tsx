/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/actions/auth";
import { Scale, CreditCard, User, LogOut, ArrowLeft } from "lucide-react";
import KrediClient from "./KrediClient";
import type { Database } from "@/types/database";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "user_type" | "credit_balance"
>;
type CreditPackage = Database["public"]["Tables"]["credit_packages"]["Row"];
type CreditTransaction = Database["public"]["Tables"]["credit_transactions"]["Row"];

interface KrediPageProps {
  searchParams: { success?: string; error?: string };
}

export default async function KrediPage({ searchParams }: KrediPageProps) {
  // Auth kontrolü
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const serviceClient = createServiceClient();

  // Profil ve kredi bakiyesi
  const profileResult = await (serviceClient
    .from("profiles")
    .select("full_name, user_type, credit_balance")
    .eq("id", user.id)
    .single() as any) as Promise<{ data: Profile | null; error: any }>;

  const { data: profile } = await profileResult;

  if (!profile || profile.user_type !== "vatandas") redirect("/buro");

  // Kredi paketleri
  const packagesResult = await (serviceClient
    .from("credit_packages")
    .select("*")
    .eq("is_active", true)
    .order("is_popular", { ascending: false })
    .order("credits", { ascending: true }) as any) as Promise<{
    data: CreditPackage[] | null;
    error: any;
  }>;

  const { data: packages } = await packagesResult;

  // Son 10 işlem
  const txResult = await (serviceClient
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10) as any) as Promise<{ data: CreditTransaction[] | null; error: any }>;

  const { data: transactions } = await txResult;

  const hasIyzicoKey = !!process.env.IYZICO_API_KEY;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="bg-primary shadow-elevated">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-white">Mizanım</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Kredi Bakiyesi */}
            <div className="flex items-center gap-2 bg-accent/20 border border-accent/40 rounded-lg px-3 py-1.5">
              <CreditCard className="w-4 h-4 text-accent" />
              <span className="font-body text-sm font-bold text-accent">
                {profile.credit_balance} kredi
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-white/60" />
              <span className="font-body text-sm text-white/80 hidden sm:block">
                {profile.full_name}
              </span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-white/60 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Geri + Başlık */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/panel"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Kredi Yönetimi
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              Kredi satın alın, bakiyenizi ve işlem geçmişinizi görüntüleyin.
            </p>
          </div>
        </div>

        {/* Başarı Banner */}
        {searchParams.success === "1" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-green-800">
                Ödeme başarıyla tamamlandı!
              </p>
              <p className="font-body text-xs text-green-700">
                Kredileriniz hesabınıza eklendi.
              </p>
            </div>
          </div>
        )}

        {/* Hata Banner */}
        {searchParams.error === "1" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-red-800">
                Ödeme işlemi başarısız oldu.
              </p>
              <p className="font-body text-xs text-red-700">
                Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin.
              </p>
            </div>
          </div>
        )}

        <KrediClient
          packages={packages || []}
          currentBalance={profile.credit_balance}
          transactions={
            (transactions || []) as {
              id: string;
              amount: number;
              type: "spend" | "purchase" | "bonus" | "refund";
              description: string;
              created_at: string;
            }[]
          }
          hasIyzicoKey={hasIyzicoKey}
        />
      </main>
    </div>
  );
}
