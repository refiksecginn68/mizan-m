import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import KararAramaClient from "./KararAramaClient";
import BuroTabBar from "@/components/buro/BuroTabBar";
import OnboardingTour from "@/components/buro/OnboardingTour";
import { TUR_ADIMLARI } from "@/lib/onboarding/tour-config";
import { BURO_TABS } from "@/lib/buro-nav";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function BuroEmsalPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  const serviceSupabase = createServiceClient() as AnyClient;
  const { data: cases } = await serviceSupabase
    .from("cases")
    .select("id, title, case_number")
    .eq("lawyer_id", user.id)
    .eq("status", "aktif")
    .order("created_at", { ascending: false });

  return (
    // Doğal sayfa kaydırması: iç scroll kutusu yok, içerik sayfayla birlikte akar
    <div className="min-h-screen bg-[#f4f5f7]">
      <BuroTabBar items={BURO_TABS.arastirma} dataTour="arastirma-sekmeler" />
      <KararAramaClient cases={(cases as AnyClient[]) || []} />
      <OnboardingTour sayfa="arastirma" adimlar={TUR_ADIMLARI.arastirma} />
    </div>
  );
}
