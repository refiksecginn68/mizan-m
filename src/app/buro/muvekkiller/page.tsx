import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import MuvekkilYonetimClient from "./MuvekkilYonetimClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function MuvekkkillerPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/panel");

  const serviceSupabase = createServiceClient() as AnyClient;

  const [clientsResult, casesResult] = await Promise.all([
    serviceSupabase
      .from("clients")
      .select("*")
      .eq("lawyer_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    serviceSupabase
      .from("cases")
      .select("id, title, case_number")
      .eq("lawyer_id", user.id)
      .eq("status", "aktif")
      .order("title"),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <MuvekkilYonetimClient
        initialClients={(clientsResult.data as AnyClient[]) ?? []}
        cases={(casesResult.data as AnyClient[]) ?? []}
      />
    </div>
  );
}
