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
      .select("id, full_name, email, phone, tc_no, address, notes, vekalet_no, dosya_no, vekalet_tarihi, noter, uyap_synced, created_at")
      .eq("lawyer_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    serviceSupabase
      .from("cases")
      .select("id, title, case_number, court, status, client_id")
      .eq("lawyer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const clients = (clientsResult.data as AnyClient[]) ?? [];
  const allCases = (casesResult.data as AnyClient[]) ?? [];

  // Her client'ın davalarını grupla
  const casesByClient: Record<string, AnyClient[]> = {};
  for (const c of allCases) {
    if (c.client_id) {
      if (!casesByClient[c.client_id]) casesByClient[c.client_id] = [];
      casesByClient[c.client_id].push(c);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <MuvekkilYonetimClient
        initialClients={clients}
        casesByClient={casesByClient}
        allCases={allCases.map((c) => ({ id: c.id, title: c.title, case_number: c.case_number }))}
      />
    </div>
  );
}
