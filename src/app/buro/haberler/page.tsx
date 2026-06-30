import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HaberlerClient from "./HaberlerClient";
import { Newspaper } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function HaberlerPage() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-[#c9a84c]" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0f1729]">Hukuki Haberler</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Yargıtay kararları, mevzuat güncellemeleri ve hukuk dünyasından haberler
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <HaberlerClient />
      </div>
    </div>
  );
}
