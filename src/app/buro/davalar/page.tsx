import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import DosyaYonetimiClient from "./DosyaYonetimiClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function DosyaYonetimiPage() {
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

  const [casesResult, clientsResult] = await Promise.all([
    serviceSupabase
      .from("cases")
      .select(`id, title, case_number, court, status, description, opposing_party, created_at, clients (id, full_name)`)
      .eq("lawyer_id", user.id)
      .order("created_at", { ascending: false }),
    serviceSupabase
      .from("clients")
      .select("id, full_name")
      .eq("lawyer_id", user.id)
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <DosyaYonetimiClient
        initialCases={(casesResult.data as AnyClient[]) ?? []}
        clients={(clientsResult.data as AnyClient[]) ?? []}
      />
    </div>
  );
}
