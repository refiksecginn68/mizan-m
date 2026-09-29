import { createClient } from "@/lib/supabase/server";
import { Users, Clock, CheckCircle2, Wallet, TrendingUp, AlertCircle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface Ozet {
  uye_toplam: number;
  uye_deneme: number;
  uye_ucretli: number;
  uye_suresi_dolmus: number;
  gelir_toplam_try: number;
  gelir_bu_ay_try: number;
  odeme_bekleyen_sayisi: number;
}

function KartUnite({ ikon: Ikon, baslik, deger, vurgu }: { ikon: Any; baslik: string; deger: string; vurgu?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${vurgu ? "border-amber-300 bg-amber-50" : "border-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Ikon className="w-4 h-4" />
        <span className="font-body text-xs font-semibold">{baslik}</span>
      </div>
      <p className="font-heading text-2xl font-bold text-primary">{deger}</p>
    </div>
  );
}

export default async function AdminOzetPage() {
  const supabase = createClient() as Any;
  const { data: ozet, error } = await supabase.rpc("admin_ozet") as { data: Ozet | null; error: Any };

  if (error || !ozet) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 font-body text-sm">
        Özet yüklenemedi: {error?.message ?? "bilinmeyen hata"}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Özet</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Bu panel yalnızca üye/ödeme sayılarını gösterir — dosya, evrak veya sohbet içeriğine erişimi yoktur.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KartUnite ikon={Users} baslik="Toplam Üye" deger={ozet.uye_toplam.toLocaleString("tr-TR")} />
        <KartUnite ikon={Clock} baslik="Deneme" deger={ozet.uye_deneme.toLocaleString("tr-TR")} />
        <KartUnite ikon={CheckCircle2} baslik="Ücretli" deger={ozet.uye_ucretli.toLocaleString("tr-TR")} />
        <KartUnite ikon={AlertCircle} baslik="Süresi Dolmuş" deger={ozet.uye_suresi_dolmus.toLocaleString("tr-TR")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KartUnite ikon={TrendingUp} baslik="Toplam Onaylı Gelir" deger={`₺${Number(ozet.gelir_toplam_try).toLocaleString("tr-TR")}`} />
        <KartUnite ikon={TrendingUp} baslik="Bu Ay Onaylı Gelir" deger={`₺${Number(ozet.gelir_bu_ay_try).toLocaleString("tr-TR")}`} />
        <KartUnite
          ikon={Wallet}
          baslik="Onay Bekleyen Ödeme"
          deger={ozet.odeme_bekleyen_sayisi.toLocaleString("tr-TR")}
          vurgu={ozet.odeme_bekleyen_sayisi > 0}
        />
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-heading text-base font-bold text-primary mb-2">Gider (AI maliyeti)</h2>
        <p className="font-body text-sm text-muted-foreground">
          Hesaplanamadı: Anthropic/Cohere/fal.ai çağrıları için sorgu başına maliyeti kaydeden bir
          kullanım logu şu an mevcut değil. Bu bölüm, o log eklenmeden gerçek/doğru rakam gösteremez —
          uydurma bir değer göstermek yerine boş bırakıldı.
        </p>
      </div>
    </div>
  );
}
