import { createClient } from "@/lib/supabase/server";
import { Users, Clock, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Wallet, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OzetTrendChart from "./OzetTrendChart";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface Ozet {
  uye_toplam: number;
  uye_deneme: number;
  uye_ucretli: number;
  uye_suresi_dolmus: number;
  gelir_toplam_try: number;
  gelir_bu_ay_try: number;
  gider_toplam_try: number;
  gider_bu_ay_try: number;
  api_maliyet_bugun_try: number;
  odeme_bekleyen_sayisi: number;
}

function try_(n: number): string {
  return `₺${Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

function KartUnite({
  ikon: Ikon,
  baslik,
  deger,
  vurgu,
}: {
  ikon: Any;
  baslik: string;
  deger: string;
  vurgu?: boolean;
}) {
  return (
    <Card className={vurgu ? "border-amber-300 bg-amber-50" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Ikon className="w-4 h-4" />
          <span className="font-body text-xs font-semibold">{baslik}</span>
        </div>
        <p className="font-heading text-2xl font-bold text-primary">{deger}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminOzetPage() {
  const supabase = createClient() as Any;
  const [{ data: ozet, error }, { data: trend }] = await Promise.all([
    supabase.rpc("admin_ozet") as Promise<{ data: Ozet | null; error: Any }>,
    supabase.rpc("admin_kullanim_trend", { p_gun_sayisi: 14 }) as Promise<{
      data: { gun: string; sorgu_sayisi: number; maliyet_try: number }[] | null;
      error: Any;
    }>,
  ]);

  if (error || !ozet) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 font-body text-sm">
        Özet yüklenemedi: {error?.message ?? "bilinmeyen hata"}
      </div>
    );
  }

  const netBuAy = ozet.gelir_bu_ay_try - ozet.gider_bu_ay_try;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Özet</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Bu panel yalnızca üye/ödeme/kullanım sayılarını gösterir — dosya, evrak veya sohbet içeriğine erişimi yoktur.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KartUnite ikon={Users} baslik="Toplam Üye" deger={ozet.uye_toplam.toLocaleString("tr-TR")} />
        <KartUnite ikon={Clock} baslik="Deneme" deger={ozet.uye_deneme.toLocaleString("tr-TR")} />
        <KartUnite ikon={CheckCircle2} baslik="Ücretli" deger={ozet.uye_ucretli.toLocaleString("tr-TR")} />
        <KartUnite ikon={AlertCircle} baslik="Süresi Dolmuş" deger={ozet.uye_suresi_dolmus.toLocaleString("tr-TR")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KartUnite ikon={TrendingUp} baslik="Bu Ay Gelir" deger={try_(ozet.gelir_bu_ay_try)} />
        <KartUnite ikon={TrendingDown} baslik="Bu Ay Gider (API)" deger={try_(ozet.gider_bu_ay_try)} />
        <KartUnite
          ikon={netBuAy >= 0 ? TrendingUp : TrendingDown}
          baslik="Bu Ay Net"
          deger={try_(netBuAy)}
          vurgu={netBuAy < 0}
        />
        <KartUnite
          ikon={Wallet}
          baslik="Onay Bekleyen Ödeme"
          deger={ozet.odeme_bekleyen_sayisi.toLocaleString("tr-TR")}
          vurgu={ozet.odeme_bekleyen_sayisi > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Son 14 Gün — Kullanım</CardTitle>
          </CardHeader>
          <CardContent>
            <OzetTrendChart veri={trend ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Bugünkü API Maliyeti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-heading text-3xl font-bold text-primary">{try_(ozet.api_maliyet_bugun_try)}</p>
            <p className="font-body text-xs text-muted-foreground">
              Toplam gider: {try_(ozet.gider_toplam_try)} · Toplam gelir: {try_(ozet.gelir_toplam_try)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
