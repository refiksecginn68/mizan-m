import { createClient } from "@/lib/supabase/server";
import ApiMaliyetClient from "./ApiMaliyetClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AdminApiMaliyetPage() {
  const supabase = createClient() as Any;
  const { data, error } = await supabase.rpc("admin_api_maliyet", { p_gun_sayisi: 30 });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 font-body text-sm">
        API maliyet verisi yüklenemedi: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">API Maliyeti</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Son 30 gün — her AI çağrısının gerçek token/model maliyeti (Anthropic gerçek token bazlı;
          Cohere/fal.ai istek bazlı tahmini).
        </p>
      </div>
      <ApiMaliyetClient
        veri={data ?? { toplam_try: 0, toplam_usd: 0, toplam_cagri: 0, surface_dagilim: [], model_dagilim: [] }}
      />
    </div>
  );
}
