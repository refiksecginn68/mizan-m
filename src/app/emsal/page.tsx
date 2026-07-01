import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VatandasHeader from "@/components/shared/VatandasHeader";
import EmsalSearch from "@/components/emsal/EmsalSearch";

export default async function EmsalPage() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyClient = supabase as any;
  const { data: { user } } = await anyClient.auth.getUser();

  if (!user) redirect("/giris");

  const { data: profile } = await anyClient
    .from("profiles")
    .select("full_name, user_type, credit_balance")
    .eq("id", user.id)
    .single() as { data: { full_name: string; user_type: string; credit_balance: number } | null };

  if (!profile || profile.user_type !== "vatandas") redirect("/buro");

  // Son 20 emsal karar yükle (initial)
  const { data: caseLaws } = await anyClient
    .from("case_laws")
    .select("id, court, case_number, decision_number, decision_date, subject, summary")
    .order("decision_date", { ascending: false })
    .limit(20) as { data: {
      id: string;
      court: string;
      case_number: string;
      decision_number: string | null;
      decision_date: string | null;
      subject: string;
      summary: string;
    }[] | null };

  return (
    <div className="min-h-screen bg-background">
      <VatandasHeader fullName={profile.full_name} creditBalance={profile.credit_balance} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-primary">Emsal Karar Arama</h1>
          <p className="font-body text-muted-foreground mt-1">
            Yargıtay, Danıştay ve Anayasa Mahkemesi kararlarında arayın.
          </p>
        </div>

        <EmsalSearch initialResults={caseLaws ?? []} />

      </main>
    </div>
  );
}
