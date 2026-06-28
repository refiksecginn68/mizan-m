import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VatandasHeader from "@/components/shared/VatandasHeader";
import DilekceWizard from "@/components/dilekce/DilekceWizard";

export default async function YeniDilecePage() {
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

  return (
    <div className="min-h-screen bg-background">
      <VatandasHeader fullName={profile.full_name} creditBalance={profile.credit_balance} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-primary">Dilekçe Üret</h1>
          <p className="font-body text-muted-foreground mt-1">
            AI destekli dilekçe, ihtarname ve başvuru belgesi oluşturun.
          </p>
        </div>

        <div className="card">
          <DilekceWizard />
        </div>
      </main>
    </div>
  );
}
