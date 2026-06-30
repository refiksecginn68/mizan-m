import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import KararAramaClient from "./KararAramaClient";

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
    <div className="min-h-screen bg-[#f4f5f7]">
      <KararAramaClient cases={(cases as AnyClient[]) || []} />
    </div>
  );
}
