/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import KrediYukleClient from "./KrediYukleClient";

interface PublicPackage {
  code: string;
  name: string;
  price_try: number;
  query_quota: number;
  is_popular: boolean;
  features: string[];
  package_type: string;
}

export default async function KrediYuklePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/kredi-yukle");

  const serviceClient = createServiceClient() as any;

  const [{ data: profile }, { data: packages }, { data: reminders }] = await Promise.all([
    serviceClient
      .from("profiles")
      .select("full_name, user_type, monthly_query_limit, monthly_query_count, additional_queries")
      .eq("id", user.id)
      .single(),
    serviceClient
      .from("credit_packages")
      .select("code, name, price_try, query_quota, is_popular, features, package_type")
      .eq("is_active", true)
      .eq("is_public", true)
      .not("code", "is", null)
      .order("price_try", { ascending: true }),
    serviceClient
      .from("payment_reminders")
      .select("id")
      .eq("user_id", user.id)
      .eq("active", true)
      .limit(1),
  ]);

  if (!profile) redirect("/giris");

  const isAvukat = profile.user_type === "avukat";
  const tumPaketler = (packages ?? []) as PublicPackage[];
  // Avukata avukat paketleri + kontör, vatandaşa vatandaş paketi + kontör
  const paketler = tumPaketler.filter((p) =>
    p.code.startsWith("kontor_") || (isAvukat ? p.code === "pro" || p.code === "max" : p.code === "vatandas")
  );

  const kalanKota = Math.max(
    0,
    (profile.monthly_query_limit ?? 0) + (profile.additional_queries ?? 0) - (profile.monthly_query_count ?? 0)
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={isAvukat ? "/buro" : "/panel"}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Kredi Yükle</h1>
            <p className="font-body text-sm text-muted-foreground">
              Paket seçin, havale/EFT ile ödeyin — onay sonrası sorgu kotanız hesabınıza tanımlanır.
            </p>
          </div>
        </div>

        <KrediYukleClient
          paketler={paketler}
          kalanKota={kalanKota}
          hatirlatmaAktif={(reminders ?? []).length > 0}
        />
      </main>
    </div>
  );
}
