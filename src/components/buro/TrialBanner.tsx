import Link from "next/link";
import { Clock, AlertTriangle } from "lucide-react";
import type { TrialDurum } from "@/lib/trial";

interface Props {
  trial: TrialDurum;
  paketVar: boolean; // aylık paket veya kontör tanımlı mı
}

// Deneme sayacı: panelde kalan gün + kalan kredi; son 3 günde belirgin uyarı,
// bitince paket alımına yönlendirme. Paketi olan kullanıcıya gösterilmez.
export default function TrialBanner({ trial, paketVar }: Props) {
  if (!trial.baslamis || paketVar) return null;

  if (!trial.aktif) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Deneme süreniz sona erdi. Kesintisiz kullanım için bir paket seçin.
        </p>
        <Link href="/kredi-yukle" className="font-body text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg transition-colors">
          Paket Seç
        </Link>
      </div>
    );
  }

  const kritik = trial.kalanGun <= 3 || trial.kalanKredi <= 100;
  return (
    <div className={`border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 ${
      kritik ? "bg-amber-50 border-amber-300" : "bg-sky-50 border-sky-200"
    }`}>
      <p className={`font-body text-sm flex items-center gap-2 ${kritik ? "text-amber-900" : "text-sky-900"}`}>
        {kritik ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <Clock className="w-4 h-4 flex-shrink-0" />}
        {kritik ? (
          <>Denemeniz bitmek üzere: <strong>{trial.kalanGun} gün</strong> · <strong>{trial.kalanKredi.toLocaleString("tr-TR")} kredi</strong> kaldı. Kesinti yaşamamak için paket alın.</>
        ) : (
          <>Deneme sürümü: <strong>{trial.kalanGun} gün</strong> · <strong>{trial.kalanKredi.toLocaleString("tr-TR")} kredi</strong> kaldı — tüm özellikler açık.</>
        )}
      </p>
      <Link
        href="/kredi-yukle"
        className={`font-body text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${
          kritik ? "text-white bg-amber-600 hover:bg-amber-700" : "text-sky-800 border border-sky-300 hover:bg-sky-100"
        }`}
      >
        Paketleri Gör
      </Link>
    </div>
  );
}
