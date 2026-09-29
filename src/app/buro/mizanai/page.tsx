import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import MizanAIBeyin from "../asistan/MizanAIBeyin";
import OnboardingTour from "@/components/buro/OnboardingTour";
import { TUR_ADIMLARI } from "@/lib/onboarding/tour-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// MizanAI sohbet sayfası — oturum geçmişi + ?chat=<id> URL senkronu.
export default async function BuroMizanAIPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  return (
    <div className="h-screen bg-[#f4f5f7] flex flex-col overflow-hidden">
      <Suspense fallback={<div className="flex-1" />}>
        <MizanAIBeyin lawyerName={profile.full_name as string} />
      </Suspense>
      <OnboardingTour sayfa="mizanai" adimlar={TUR_ADIMLARI.mizanai} />
    </div>
  );
}
