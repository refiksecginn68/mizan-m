"use client";

import { useMemo, useState } from "react";
import { Scale, FileText, Folder, FolderOpen, ChevronRight, ChevronDown, Info } from "lucide-react";

interface Taraf { rol?: string; tip?: string; ad?: string; vekil?: string; muvekkil?: boolean }
interface Evrak { ad?: string; tarih?: string; klasor?: string }
interface Safahat { tarih?: string; islem?: string; aciklama?: string }

interface Props {
  dosyaBilgileri: { esasNo?: string | null; birim?: string | null; tur?: string | null; durum?: string | null; acilis?: string | null };
  taraflar: Taraf[];
  evraklar: Evrak[];
  safahat: Safahat[];
}

const SEKMELER = ["Dosya Bilgileri", "Taraf Bilgileri", "Evrak", "Safahat"] as const;

// Evrak listesini klasör yoluna göre ağaca çevirir (UYAP evrak ağacı görünümü)
function evrakAgaci(evraklar: Evrak[]) {
  const kok: Record<string, Evrak[]> = {};
  for (const e of evraklar) {
    const k = e.klasor || "Evraklar";
    (kok[k] ??= []).push(e);
  }
  return Object.entries(kok).sort(([a], [b]) => a.localeCompare(b, "tr"));
}

export default function UyapDosyaSekmeleri({ dosyaBilgileri, taraflar, evraklar, safahat }: Props) {
  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]>("Dosya Bilgileri");
  const [acikKlasor, setAcikKlasor] = useState<Record<string, boolean>>({});
  const [seciliEvrak, setSeciliEvrak] = useState<Evrak | null>(null);
  const agac = useMemo(() => evrakAgaci(evraklar), [evraklar]);

  return (
    <div className="card">
      <div className="flex items-center gap-1 border-b border-border mb-4 overflow-x-auto">
        {SEKMELER.map((s) => (
          <button key={s} onClick={() => setSekme(s)}
            className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              sekme === s ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {s}
            {s === "Taraf Bilgileri" && taraflar.length > 0 && <span className="ml-1 text-[9px] opacity-60">({taraflar.length})</span>}
            {s === "Evrak" && evraklar.length > 0 && <span className="ml-1 text-[9px] opacity-60">({evraklar.length})</span>}
            {s === "Safahat" && safahat.length > 0 && <span className="ml-1 text-[9px] opacity-60">({safahat.length})</span>}
          </button>
        ))}
      </div>

      {sekme === "Dosya Bilgileri" && (
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            ["Birim", dosyaBilgileri.birim],
            ["Dosya No", dosyaBilgileri.esasNo],
            ["Dosya Türü", dosyaBilgileri.tur],
            ["Dosya Durumu", dosyaBilgileri.durum],
            ["Dosya Açılış Tarihi", dosyaBilgileri.acilis],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k as string} className="bg-primary/5 rounded-xl p-3">
              <dt className="font-body text-xs text-muted-foreground">{k}</dt>
              <dd className="font-body text-sm text-foreground mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {sekme === "Taraf Bilgileri" && (
        taraflar.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground py-4 text-center">UYAP taraf bilgisi henüz aktarılmadı. Eklentiden &quot;Derin Tarama&quot; çalıştırın.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Rol</th>
                  <th className="py-2 pr-3 font-semibold">Tipi</th>
                  <th className="py-2 pr-3 font-semibold">Adı</th>
                  <th className="py-2 font-semibold">Vekil</th>
                </tr>
              </thead>
              <tbody>
                {taraflar.map((t, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-muted-foreground">{t.rol || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{t.tip || "—"}</td>
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {t.ad}
                      {t.muvekkil && <span className="ml-2 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">MÜVEKKİL</span>}
                    </td>
                    <td className="py-2 text-muted-foreground">{t.vekil || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {sekme === "Evrak" && (
        evraklar.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground py-4 text-center">UYAP evrak listesi henüz aktarılmadı. Eklentiden &quot;Derin Tarama&quot; çalıştırın.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Sol: klasör ağacı (UYAP evrak treeview düzeni) */}
            <div className="border border-border rounded-xl p-2 max-h-96 overflow-y-auto">
              {agac.map(([klasor, list]) => {
                const acik = acikKlasor[klasor] ?? false;
                return (
                  <div key={klasor}>
                    <button onClick={() => setAcikKlasor({ ...acikKlasor, [klasor]: !acik })}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-primary/5 text-left">
                      {acik ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                      {acik ? <FolderOpen className="w-4 h-4 text-accent flex-shrink-0" /> : <Folder className="w-4 h-4 text-accent flex-shrink-0" />}
                      <span className="font-body text-xs font-medium text-foreground truncate">{klasor}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto flex-shrink-0">{list.length}</span>
                    </button>
                    {acik && list.map((e, i) => (
                      <button key={i} onClick={() => setSeciliEvrak(e)}
                        className={`w-full flex items-center gap-1.5 pl-8 pr-2 py-1 rounded-lg text-left hover:bg-primary/5 ${seciliEvrak === e ? "bg-accent/10" : ""}`}>
                        <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-body text-[11px] text-foreground truncate">{e.ad}</span>
                        {e.tarih && <span className="text-[9px] text-muted-foreground ml-auto flex-shrink-0">{e.tarih}</span>}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            {/* Sağ: önizleme bölmesi */}
            <div className="border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[160px]">
              {seciliEvrak ? (
                <>
                  <FileText className="w-8 h-8 text-accent mb-2" />
                  <p className="font-body text-sm font-medium text-foreground">{seciliEvrak.ad}</p>
                  {seciliEvrak.tarih && <p className="font-body text-xs text-muted-foreground mt-1">Tarih: {seciliEvrak.tarih}</p>}
                  {seciliEvrak.klasor && <p className="font-body text-xs text-muted-foreground mt-0.5">Klasör: {seciliEvrak.klasor}</p>}
                  <p className="font-body text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Evrak içeriği UYAP&apos;ta; burada üst veri tutulur.
                  </p>
                </>
              ) : (
                <p className="font-body text-sm text-muted-foreground">Görüntülemek istediğiniz evrakı yandaki listeden seçiniz</p>
              )}
            </div>
          </div>
        )
      )}

      {sekme === "Safahat" && (
        safahat.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground py-4 text-center">UYAP safahat kaydı henüz aktarılmadı. Eklentiden &quot;Derin Tarama&quot; çalıştırın.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {safahat.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-primary/5">
                <Scale className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-body text-xs text-muted-foreground">{s.tarih}{s.islem ? ` · ${s.islem}` : ""}</p>
                  {s.aciklama && <p className="font-body text-sm text-foreground mt-0.5">{s.aciklama}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
