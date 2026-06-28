import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MizanAIBeyin from "./MizanAIBeyin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function BuroAsistanPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/panel");

  return (
    <div className="h-screen bg-[#f4f5f7] flex flex-col overflow-hidden">
      <MizanAIBeyin lawyerName={profile.full_name as string} />
    </div>
  );
}
