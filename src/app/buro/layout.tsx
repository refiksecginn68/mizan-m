import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BuroLeftSidebar from "@/components/buro/BuroLeftSidebar";
import MizanAIFloating from "@/components/buro/MizanAIFloating";
import BuroMobileNav from "@/components/buro/BuroMobileNav";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function BuroLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const serviceSupabase = createServiceClient() as AnyClient;
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7]">
      <BuroLeftSidebar lawyerName={profile.full_name} />
      <main className="flex-1 overflow-y-auto min-w-0 pb-14 lg:pb-0">
        {children}
      </main>
      <MizanAIFloating lawyerName={profile.full_name} />
      <BuroMobileNav />
    </div>
  );
}
