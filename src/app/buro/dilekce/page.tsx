import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import DilekceAvukatClient from "./DilekceAvukatClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

interface PageProps {
  searchParams: { konu?: string; tur?: string };
}

export default async function DilecePage({ searchParams }: PageProps) {
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

  // Şablonlarım: yalnızca kullanıcının bilinçli kaydettikleri (avukat_sablon).
  // AI üretim geçmişi (avukat_dilekce) otomatik kaydedilir, burada listelenmez.
  const [{ data: sablonar }, { data: favoriRows }] = await Promise.all([
    serviceSupabase
      .from("generated_documents")
      .select("id, title, document_type, content, created_at")
      .eq("user_id", user.id)
      .eq("document_type", "avukat_sablon")
      .order("created_at", { ascending: false })
      .limit(50),
    serviceSupabase
      .from("dilekce_favoriler")
      .select("sablon_id")
      .eq("user_id", user.id),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <DilekceAvukatClient
        lawyerName={profile.full_name}
        sablonar={(sablonar as AnyClient[]) || []}
        initialFavoriler={((favoriRows as AnyClient[]) || []).map((r) => r.sablon_id as string)}
        initialKonu={searchParams.konu ?? ""}
        initialTur={searchParams.tur ?? ""}
      />
    </div>
  );
}
