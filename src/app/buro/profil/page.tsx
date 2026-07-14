import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import ProfilClient from "./ProfilClient";
import ProfilTabs from "./ProfilTabs";
import OdemelerTab from "./OdemelerTab";
import AyarlarTab from "./AyarlarTab";
import { getTrialDurum } from "@/lib/trial";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function ProfilPage({ searchParams }: { searchParams?: { sekme?: string } }) {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const serviceSupabase = createServiceClient() as AnyClient;
  const [{ data: profile }, { data: odemeler }, { data: paketler }] = await Promise.all([
    serviceSupabase
      .from("profiles")
      .select("full_name, email, user_type, phone, avatar_url, bar_city, bar_number, university, specializations, achievements, hobbies, personal_notes, profile_documents, monthly_query_limit, monthly_query_count, additional_queries, trial_started_at, trial_ends_at, trial_queries_left, email_notifications")
      .eq("id", user.id)
      .single(),
    serviceSupabase
      .from("payment_requests")
      .select("reference_code, package_code, amount_try, status, receipt_no, created_at, approved_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    serviceSupabase
      .from("credit_packages")
      .select("code, name"),
  ]);

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  const paketAdi = new Map<string, string>((paketler ?? []).map((p: AnyClient) => [p.code, p.name]));
  const odemeListesi = (odemeler ?? []).map((o: AnyClient) => ({
    ...o,
    package_name: paketAdi.get(o.package_code) ?? o.package_code,
  }));

  // Aktif paket: en son onaylanan aylık paket (aylık limiti varsa)
  const sonAylik = odemeListesi.find(
    (o: AnyClient) => o.status === "approved" && !o.package_code.startsWith("kontor_")
  );
  const aktifPaket = (profile.monthly_query_limit ?? 0) > 0 ? (sonAylik?.package_name ?? null) : null;

  const sekme = searchParams?.sekme;
  const varsayilan = sekme === "odemeler" || sekme === "ayarlar" ? sekme : "profil";

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-[#0f1729]">Hesabım</h1>
          <p className="font-body text-sm text-gray-500 mt-1">
            Profil bilgileriniz, ödemeleriniz ve hesap ayarlarınız.
          </p>
        </div>
        <ProfilTabs
          varsayilan={varsayilan}
          profil={<ProfilClient initialProfile={profile as AnyClient} />}
          odemeler={
            <OdemelerTab
              odemeler={odemeListesi}
              aktifPaket={aktifPaket}
              aylikLimit={profile.monthly_query_limit ?? 0}
              aylikKullanilan={profile.monthly_query_count ?? 0}
              kontor={profile.additional_queries ?? 0}
              trial={getTrialDurum(profile)}
            />
          }
          ayarlar={<AyarlarTab emailBildirim={profile.email_notifications ?? true} />}
        />
      </main>
    </div>
  );
}
