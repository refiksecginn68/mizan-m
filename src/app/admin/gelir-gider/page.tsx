import { createClient } from "@/lib/supabase/server";
import GelirGiderClient from "./GelirGiderClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AdminGelirGiderPage() {
  const supabase = createClient() as Any;
  const { data, error } = await supabase.rpc("admin_gelir_gider", { p_ay_sayisi: 6 });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 font-body text-sm">
        Gelir-gider verisi yüklenemedi: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Gelir-Gider</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Son 6 ay — onaylı ödemelerden gelir, AI kullanım logundan gerçek gider.
        </p>
      </div>
      <GelirGiderClient veri={data ?? []} />
    </div>
  );
}
