import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VatandasHeader from "@/components/shared/VatandasHeader";
import ProfilClient from "./ProfilClient";
import { UserCircle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function ProfilPage() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, credit_balance, phone, created_at")
    .eq("id", user.id)
    .single() as { data: { full_name: string; user_type: string; credit_balance: number; phone: string | null; created_at: string } | null };

  if (!profile) redirect("/giris");
  if (profile.user_type !== "vatandas") redirect("/buro");

  return (
    <div className="min-h-screen bg-background">
      <VatandasHeader fullName={profile.full_name} creditBalance={profile.credit_balance} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Profilim</h1>
            <p className="font-body text-sm text-muted-foreground">Hesap bilgilerinizi güncelleyin</p>
          </div>
        </div>

        <ProfilClient
          fullName={profile.full_name}
          phone={profile.phone}
          email={user.email ?? ""}
          creditBalance={profile.credit_balance}
          createdAt={profile.created_at}
        />
      </main>
    </div>
  );
}
