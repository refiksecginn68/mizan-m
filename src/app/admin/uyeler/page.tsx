import { createClient } from "@/lib/supabase/server";
import UyelerClient from "./UyelerClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AdminUyelerPage() {
  const supabase = createClient() as Any;
  const { data, error } = await supabase.rpc("admin_uye_listesi");

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 font-body text-sm">
        Üye listesi yüklenemedi: {error.message}
      </div>
    );
  }

  return <UyelerClient uyeler={data ?? []} />;
}
