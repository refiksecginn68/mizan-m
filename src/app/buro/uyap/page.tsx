import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import UYAPClient from "./UYAPClient";
import EklentiBaglanti from "@/components/buro/EklentiBaglanti";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function UYAPPage() {
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

  const [{ data: cases }, { data: clients }] = await Promise.all([
    serviceSupabase
      .from("cases")
      .select("id, title, case_number")
      .eq("lawyer_id", user.id)
      .eq("status", "aktif")
      .order("created_at", { ascending: false }),
    serviceSupabase
      .from("clients")
      .select("id, name, tc_number")
      .eq("lawyer_id", user.id)
      .order("name"),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-primary">UYAP Entegrasyonu</h1>
          <p className="font-body text-muted-foreground mt-1">
            Ulusal Yargı Ağı Projesi — dosya sorgulama, müvekkil entegrasyonu ve UDF belge üretimi
          </p>
        </div>
        <UYAPClient
          cases={(cases as AnyClient[]) || []}
          clients={(clients as AnyClient[]) || []}
        />
        <EklentiBaglanti />
      </main>
    </div>
  );
}
