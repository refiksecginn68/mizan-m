import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MevzuatAramaClient from "./MevzuatAramaClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function MevzuatPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <MevzuatAramaClient />
    </div>
  );
}
