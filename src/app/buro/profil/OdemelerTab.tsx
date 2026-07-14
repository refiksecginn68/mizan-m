import Link from "next/link";
import { CreditCard, Landmark, Download } from "lucide-react";
import type { TrialDurum } from "@/lib/trial";

interface Odeme {
  reference_code: string;
  package_name: string;
  amount_try: number;
  status: string;
  receipt_no: string | null;
  created_at: string;
  approved_at: string | null;
}

interface Props {
  odemeler: Odeme[];
  aktifPaket: string | null;
  aylikLimit: number;
  aylikKullanilan: number;
  kontor: number;
  trial: TrialDurum;
}

const DURUM: Record<string, { ad: string; stil: string }> = {
  pending: { ad: "Onay Bekliyor", stil: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { ad: "Onaylandı", stil: "bg-green-50 text-green-700 border-green-200" },
  rejected: { ad: "Reddedildi", stil: "bg-red-50 text-red-700 border-red-200" },
};

export default function OdemelerTab({ odemeler, aktifPaket, aylikLimit, aylikKullanilan, kontor, trial }: Props) {
  const aylikKalan = Math.max(0, aylikLimit - aylikKullanilan);

  return (
    <div className="space-y-6">
      {/* Aktif paket + kalan kota */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6">
        <h2 className="font-heading text-base font-bold text-primary mb-4">Aktif Paket ve Kota</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-[#f8f9fa] rounded-xl p-4">
            <p className="font-body text-[11px] text-muted-foreground">Paket</p>
            <p className="font-heading text-lg font-bold text-primary">
              {aktifPaket ?? (trial.aktif ? "Deneme Sürümü" : "Paket yok")}
            </p>
            {trial.aktif && !aktifPaket && (
              <p className="font-body text-xs text-accent mt-0.5">{trial.kalanGun} gün kaldı</p>
            )}
          </div>
          <div className="bg-[#f8f9fa] rounded-xl p-4">
            <p className="font-body text-[11px] text-muted-foreground">Aylık Kota</p>
            <p className="font-heading text-lg font-bold text-primary">
              {aylikLimit > 0 ? `${aylikKalan.toLocaleString("tr-TR")} / ${aylikLimit.toLocaleString("tr-TR")}` : "—"}
            </p>
          </div>
          <div className="bg-[#f8f9fa] rounded-xl p-4">
            <p className="font-body text-[11px] text-muted-foreground">
              {trial.aktif && !aktifPaket ? "Deneme Kredisi" : "Kontör (Ek Sorgu)"}
            </p>
            <p className="font-heading text-lg font-bold text-primary">
              {(trial.aktif && !aktifPaket ? trial.kalanKredi : kontor).toLocaleString("tr-TR")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          <Link href="/kredi-yukle" className="btn-primary px-6 py-2 text-sm inline-flex items-center gap-2">
            <Landmark className="w-4 h-4" /> Kontör / Paket Yükle
          </Link>
          <span
            title="Kredi kartı ile ödeme yakında"
            className="inline-flex items-center gap-2 font-body text-xs text-muted-foreground border border-dashed border-border rounded-lg px-4 py-2 cursor-not-allowed opacity-70"
          >
            <CreditCard className="w-4 h-4" /> Kredi Kartı — Yakında
          </span>
        </div>
      </div>

      {/* Ödeme geçmişi */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6">
        <h2 className="font-heading text-base font-bold text-primary mb-4">Ödeme Geçmişi</h2>
        {odemeler.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">Henüz bir ödeme kaydınız yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Tarih", "Paket", "Tutar", "Referans", "Dekont No", "Durum"].map((b) => (
                    <th key={b} className="font-body text-[11px] font-semibold text-muted-foreground uppercase py-2 pr-4">{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {odemeler.map((o) => {
                  const durum = DURUM[o.status] ?? { ad: o.status, stil: "bg-gray-50 text-gray-600 border-gray-200" };
                  return (
                    <tr key={o.reference_code} className="border-b border-gray-100 last:border-0">
                      <td className="font-body text-xs text-primary py-3 pr-4 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="font-body text-xs text-primary py-3 pr-4">{o.package_name}</td>
                      <td className="font-body text-xs font-bold text-primary py-3 pr-4">₺{o.amount_try.toLocaleString("tr-TR")}</td>
                      <td className="font-body text-xs text-accent py-3 pr-4">{o.reference_code}</td>
                      <td className="font-body text-xs text-muted-foreground py-3 pr-4">{o.receipt_no ?? "—"}</td>
                      <td className="py-3">
                        <span className={`inline-block font-body text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${durum.stil}`}>
                          {durum.ad}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="font-body text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Fatura/dekont talepleriniz için <Link href="/iletisim" className="text-accent underline">iletişim sayfasından</Link> bize ulaşın — e-Arşiv fatura desteği yakında.
        </p>
      </div>
    </div>
  );
}
