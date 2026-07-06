import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import ProfilClient from "./ProfilClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function ProfilPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const serviceSupabase = createServiceClient() as AnyClient;
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("full_name, email, user_type, phone, avatar_url, bar_city, bar_number, university, specializations, achievements, hobbies, personal_notes, profile_documents")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-[#0f1729]">Profilim</h1>
          <p className="font-body text-sm text-gray-500 mt-1">
            Bu bilgiler MizanAI asistanının bağlamına gider — uzmanlık alanlarınıza uygun, daha isabetli yanıtlar almanızı sağlar.
          </p>
        </div>
        <ProfilClient initialProfile={profile as AnyClient} />
      </main>
    </div>
  );
}
