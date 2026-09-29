"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useOnboardingTourContext } from "@/components/buro/OnboardingTourProvider";

export interface TurAdimi {
  /** Hedef öğeyi bulmak için CSS seçici — data-tour="..." attribute'u kullanın */
  secici: string;
  baslik: string;
  metin: string;
}

interface Props {
  sayfa: string;
  adimlar: TurAdimi[];
}

interface Konum {
  top: number;
  left: number;
  width: number;
  height: number;
}

const MASAUSTU_MIN_GENISLIK = 1024; // lg breakpoint — sidebar/nav'ın kullandığı eşik

// Sayfaya özel, bir kerelik tanıtım turu: highlight + ok balonu, ekranı karartmaz.
// Tamamlanma/atlama durumu DB'de (OnboardingTourProvider) saklanır.
export default function OnboardingTour({ sayfa, adimlar }: Props) {
  const { yuklendi, durum, isaretle } = useOnboardingTourContext();
  const [adim, setAdim] = useState(0);
  const [konum, setKonum] = useState<Konum | null>(null);
  const [masaustu, setMasaustu] = useState(false);
  const [aktif, setAktif] = useState(false);

  useEffect(() => {
    setMasaustu(window.innerWidth >= MASAUSTU_MIN_GENISLIK);
  }, []);

  // Tur hiç gösterilmemişse ve masaüstündeysek başlat
  useEffect(() => {
    if (!yuklendi || !masaustu) return;
    if (durum[sayfa]) return; // zaten tamamlanmış/atlanmış
    setAktif(true);
  }, [yuklendi, masaustu, durum, sayfa]);

  // Hedef öğeyi bekle (veri yüklemesi bitmeden gösterme) ve konumunu takip et
  useEffect(() => {
    if (!aktif) return;
    const hedefSecici = adimlar[adim]?.secici;
    if (!hedefSecici) return;

    let iptal = false;
    let deneme = 0;

    function konumHesapla() {
      const el = document.querySelector(hedefSecici);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      setKonum({ top: r.top, left: r.left, width: r.width, height: r.height });
      return true;
    }

    const dene = setInterval(() => {
      deneme += 1;
      if (iptal) return;
      if (konumHesapla() || deneme > 50) clearInterval(dene); // ~10s sonra vazgeç
    }, 200);

    const guncelle = () => konumHesapla();
    window.addEventListener("scroll", guncelle, true);
    window.addEventListener("resize", guncelle);

    return () => {
      iptal = true;
      clearInterval(dene);
      window.removeEventListener("scroll", guncelle, true);
      window.removeEventListener("resize", guncelle);
    };
  }, [aktif, adim, adimlar]);

  if (!aktif || !masaustu || !konum) return null;

  const mevcutAdim = adimlar[adim];
  const sonAdim = adim === adimlar.length - 1;
  const azaltilmisHareket = typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function kapat(sonucDurum: "tamamlandi" | "atlandi") {
    isaretle(sayfa, sonucDurum);
    setAktif(false);
  }

  // Balon, hedefin altına sığmazsa üstüne yerleşir
  const balonUstte = konum.top > window.innerHeight - 220;
  const balonStil = {
    top: balonUstte ? Math.max(8, konum.top - 12) : konum.top + konum.height + 12,
    left: Math.min(Math.max(8, konum.left), window.innerWidth - 320),
    transform: balonUstte ? "translateY(-100%)" : undefined,
  };

  return (
    <>
      {/* Hedefi çevreleyen highlight halkası — ekran karartılmaz */}
      <div
        aria-hidden
        className={`fixed z-[100] pointer-events-none rounded-lg ring-2 ring-accent ring-offset-2 ring-offset-white/40 ${azaltilmisHareket ? "" : "transition-all duration-200"}`}
        style={{ top: konum.top - 4, left: konum.left - 4, width: konum.width + 8, height: konum.height + 8 }}
      />

      <div
        role="dialog"
        aria-label={mevcutAdim.baslik}
        className={`fixed z-[101] w-72 bg-white rounded-2xl shadow-2xl border border-border p-4 ${azaltilmisHareket ? "" : "transition-all duration-200"}`}
        style={balonStil}
      >
        <button
          onClick={() => kapat("atlandi")}
          className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground"
          aria-label="Turu atla"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="font-body text-[10px] font-semibold text-accent uppercase tracking-wide mb-1">
          Adım {adim + 1} / {adimlar.length}
        </p>
        <h3 className="font-heading text-sm font-bold text-primary mb-1 pr-4">{mevcutAdim.baslik}</h3>
        <p className="font-body text-xs text-muted-foreground leading-relaxed mb-3">{mevcutAdim.metin}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={() => kapat("atlandi")}
            className="font-body text-xs text-muted-foreground hover:text-foreground"
          >
            Atla
          </button>
          <button
            onClick={() => (sonAdim ? kapat("tamamlandi") : setAdim((a) => a + 1))}
            className="btn-primary text-xs px-4 py-1.5"
          >
            {sonAdim ? "Bitti" : "İleri"}
          </button>
        </div>
      </div>
    </>
  );
}
