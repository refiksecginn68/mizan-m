// Kur şeridi — SERVER component. Sayfa üstünde ince şerit.
// Fetch hatasında sayfa çökmez; şerit kendi hata/bayat durumunu gösterir.
import { tcmbKurGetir } from "@/lib/kur/tcmb";

export default async function KurSerit() {
  const kur = await tcmbKurGetir();

  if (!kur.ok) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-1.5 text-xs text-amber-700">
        Kur bilgisi şu an alınamıyor{kur.hata ? ` (${kur.hata})` : ""}. Hesaplamalar bundan etkilenmez.
      </div>
    );
  }

  return (
    <div className="bg-[#0f1729] border-b border-white/5 px-4 sm:px-6 py-1.5 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-4 text-xs whitespace-nowrap">
        <span className="text-white/40 font-medium">
          TCMB {kur.bayat ? `· son yayınlanan kur: ${kur.tarih}` : `· ${kur.tarih}`}
        </span>
        {kur.kurlar.map((k) => (
          <span key={k.kod} className="flex items-center gap-1.5">
            <span className="font-semibold text-[#c9a84c]">{k.kod}</span>
            <span className="text-white/70">{k.satis?.toFixed(4) ?? "—"}</span>
          </span>
        ))}
        {kur.bayat && <span className="text-amber-400/80">(bugün güncellenmedi)</span>}
      </div>
    </div>
  );
}
