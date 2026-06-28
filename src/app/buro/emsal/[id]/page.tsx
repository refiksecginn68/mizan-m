import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KararIncelemeClient from "./KararIncelemeClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function KararIncelemePage({ params }: { params: { id: string } }) {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/panel");

  const kararId = decodeURIComponent(params.id);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <KararIncelemeClient kararId={kararId} />
    </div>
  );
}
