import { createClient } from "@/lib/supabase/server";
import KullanimClient from "./KullanimClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AdminKullanimPage() {
  const supabase = createClient() as Any;
  const [{ data: trend, error: trendErr }, { data: kota, error: kotaErr }] = await Promise.all([
    supabase.rpc("admin_kullanim_trend", { p_gun_sayisi: 30 }),
    supabase.rpc("admin_kota_durum"),
  ]);

  if (trendErr || kotaErr) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 font-body text-sm">
        Kullanım verisi yüklenemedi: {trendErr?.message ?? kotaErr?.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Kullanım</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Sorgu hacmi trendi ve paket bazında kota doluluk durumu.
        </p>
      </div>
      <KullanimClient trend={trend ?? []} kota={kota ?? []} />
    </div>
  );
}
