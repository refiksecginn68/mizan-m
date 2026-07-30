import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tcmbKurGetir } from "@/lib/kur/tcmb";
import KurSerit from "@/components/hesaplama/KurSerit";
import HesaplamaClient from "@/components/hesaplama/HesaplamaClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// Sayfa server component; hesap etkileşimi client'ta (submit ile, her tuşta değil).
export default async function HesaplamaPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  const kur = await tcmbKurGetir();

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <KurSerit />
      <HesaplamaClient kurlar={kur.kurlar} kurTarih={kur.tarih} kurBayat={kur.bayat} />
    </div>
  );
}
