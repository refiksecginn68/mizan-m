import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VatandasHeader from "@/components/shared/VatandasHeader";
import UYAPVatandasClient from "./UYAPVatandasClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export const metadata = {
  title: "UYAP Dosya Sorgulama | Mizanım",
  description: "Mahkeme dosyanızı UYAP üzerinden sorgulayın ve AI ile istişare edin.",
};

export default async function VatandasUYAPPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/uyap");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, credits")
    .eq("id", user.id)
    .single();

  if (profile?.user_type === "avukat") redirect("/buro/uyap");

  return (
    <div className="min-h-screen bg-background">
      <VatandasHeader
        userName={profile?.full_name}
        credits={profile?.credits ?? 0}
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-primary">UYAP Dosya Sorgulama</h1>
          <p className="font-body text-muted-foreground mt-1">
            TC kimlik numaranız ile mahkeme dosyanızı sorgulayın, AI asistanımızla istişare edin.
          </p>
        </div>
        <UYAPVatandasClient credits={profile?.credits ?? 0} />
      </main>
    </div>
  );
}
