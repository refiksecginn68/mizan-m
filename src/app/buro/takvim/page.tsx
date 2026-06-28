import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import BuroHeader from "@/components/shared/BuroHeader";
import TakvimClient from "./TakvimClient";
import { Calendar } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function TakvimPage() {
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

  // Son 30 gün + gelecek 3 ay
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  const toDate = new Date();
  toDate.setMonth(toDate.getMonth() + 3);

  const [eventsResult, casesResult, clientsResult, tokenResult] = await Promise.all([
    serviceSupabase
      .from("calendar_events")
      .select(`*, cases (id, title, case_number), clients (id, full_name)`)
      .eq("lawyer_id", user.id)
      .gte("starts_at", fromDate.toISOString())
      .lte("starts_at", toDate.toISOString())
      .order("starts_at", { ascending: true }),
    serviceSupabase
      .from("cases")
      .select("id, title, case_number")
      .eq("lawyer_id", user.id)
      .eq("status", "aktif"),
    serviceSupabase
      .from("clients")
      .select("id, full_name")
      .eq("lawyer_id", user.id)
      .eq("is_active", true)
      .order("full_name"),
    serviceSupabase
      .from("google_calendar_tokens")
      .select("lawyer_id")
      .eq("lawyer_id", user.id)
      .single(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <BuroHeader lawyerName={profile.full_name} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Takvim</h1>
            <p className="font-body text-sm text-muted-foreground">
              Duruşma, toplantı ve süre takibi
            </p>
          </div>
        </div>

        <TakvimClient
          initialEvents={eventsResult.data ?? []}
          cases={casesResult.data ?? []}
          clients={clientsResult.data ?? []}
          googleConnected={!!tokenResult.data}
        />
      </main>
    </div>
  );
}
