import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import FinansClient from "./FinansClient";
import { TrendingUp } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function FinansPage({
  searchParams,
}: {
  searchParams?: { client?: string; clientName?: string; case?: string; caseTitle?: string };
}) {
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

  const [{ data: payments }, { data: clients }, { data: cases }] = await Promise.all([
    serviceSupabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    serviceSupabase
      .from("clients")
      .select("id, full_name")
      .eq("lawyer_id", user.id)
      .order("full_name"),
    serviceSupabase
      .from("cases")
      .select("id, title, case_number, client_id")
      .eq("lawyer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Finans</h1>
            <p className="font-body text-sm text-muted-foreground">
              Tahsilat ve ödeme takibi
            </p>
          </div>
        </div>

        <FinansClient
          initialPayments={payments ?? []}
          clients={clients ?? []}
          cases={cases ?? []}
          preselect={{
            clientId: searchParams?.client,
            clientName: searchParams?.clientName,
            caseId: searchParams?.case,
            caseTitle: searchParams?.caseTitle,
          }}
        />

      </main>
    </div>
  );
}
