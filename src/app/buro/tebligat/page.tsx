import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import TebligatClient from "./TebligatClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function TebligatPage() {
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

  const [tebligatResult, casesResult] = await Promise.all([
    serviceSupabase
      .from("tebligat_records")
      .select(`
        id,
        case_id,
        sender,
        subject,
        received_at,
        deadline_at,
        status,
        content,
        is_read,
        created_at,
        cases (id, title, case_number)
      `)
      .eq("lawyer_id", user.id)
      .order("deadline_at", { ascending: true, nullsFirst: false }),
    serviceSupabase
      .from("cases")
      .select("id, title, case_number")
      .eq("lawyer_id", user.id)
      .eq("status", "aktif")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-primary">E-Tebligat Takibi</h1>
          <p className="font-body text-muted-foreground mt-1">
            UETS üzerinden gelen e-tebligatlarınızı takip edin, süre hesaplayın
          </p>
        </div>
        <TebligatClient
          initialTebligatlar={(tebligatResult.data as AnyClient[]) || []}
          cases={(casesResult.data as AnyClient[]) || []}
        />
      </main>
    </div>
  );
}
