import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BuroLeftSidebar from "@/components/buro/BuroLeftSidebar";
import MizanAIFloating from "@/components/buro/MizanAIFloating";
import BuroMobileNav from "@/components/buro/BuroMobileNav";
import BuroContentHeader from "@/components/buro/BuroContentHeader";
import OnboardingModal from "@/components/buro/OnboardingModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function BuroLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, onboarding_completed, specializations, bar_city")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/giris");
  if (profile.user_type !== "avukat") redirect("/panel");

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7]">
      <BuroLeftSidebar lawyerName={profile.full_name} />
      <main className="flex-1 overflow-y-auto min-w-0 pb-14 lg:pb-0">
        <BuroContentHeader />
        {children}
      </main>
      <MizanAIFloating lawyerName={profile.full_name} />
      <BuroMobileNav />
      {!profile.onboarding_completed && <OnboardingModal />}
    </div>
  );
}
