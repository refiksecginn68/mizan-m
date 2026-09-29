import { createClient } from "@/lib/supabase/server";
import OdemelerClient from "./OdemelerClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AdminOdemelerPage() {
  const supabase = createClient() as Any;
  const { data, error } = await supabase.rpc("admin_odemeler");

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 font-body text-sm">
        Ödeme listesi yüklenemedi: {error.message}
      </div>
    );
  }

  return <OdemelerClient odemeler={data ?? []} />;
}
