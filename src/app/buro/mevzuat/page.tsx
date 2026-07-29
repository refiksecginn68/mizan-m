import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MevzuatAramaClient from "./MevzuatAramaClient";
import BuroTabBar from "@/components/buro/BuroTabBar";
import { BURO_TABS } from "@/lib/buro-nav";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function MevzuatPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <BuroTabBar items={BURO_TABS.arastirma} />
      <MevzuatAramaClient />
    </div>
  );
}
