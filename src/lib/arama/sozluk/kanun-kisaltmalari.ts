// Türk hukukunda yaygın kanun kısaltmaları ve tam adları.
// Genişletilebilir — yeni kısaltma eklerken kısa ad + tam ad ikisini de yaz.

import { trLower } from "@/lib/services/bedesten";

export interface KanunGirdisi {
  kisaltma: string;
  tamAd: string;
  /** Tam adın sorguda geçebilecek alternatif yazımları (ör. "İş Kanunu" / "İş K.") */
  esanlamlar: string[];
}

export const KANUNLAR: KanunGirdisi[] = [
  { kisaltma: "İİK", tamAd: "İcra ve İflas Kanunu", esanlamlar: ["icra iflas kanunu", "icra ve iflas k"] },
  { kisaltma: "TMK", tamAd: "Türk Medeni Kanunu", esanlamlar: ["medeni kanun", "medeni k"] },
  { kisaltma: "TBK", tamAd: "Türk Borçlar Kanunu", esanlamlar: ["borçlar kanunu", "borçlar k"] },
  { kisaltma: "HMK", tamAd: "Hukuk Muhakemeleri Kanunu", esanlamlar: ["hukuk muhakemeleri k"] },
  { kisaltma: "TCK", tamAd: "Türk Ceza Kanunu", esanlamlar: ["ceza kanunu", "ceza k"] },
  { kisaltma: "CMK", tamAd: "Ceza Muhakemesi Kanunu", esanlamlar: ["ceza muhakemesi k"] },
  { kisaltma: "TTK", tamAd: "Türk Ticaret Kanunu", esanlamlar: ["ticaret kanunu", "ticaret k"] },
  { kisaltma: "İYUK", tamAd: "İdari Yargılama Usulü Kanunu", esanlamlar: ["idari yargılama usulü k"] },
  { kisaltma: "İş K.", tamAd: "İş Kanunu", esanlamlar: ["iş kanunu", "iş k"] },
  { kisaltma: "KVKK", tamAd: "Kişisel Verilerin Korunması Kanunu", esanlamlar: ["kişisel verilerin korunması k"] },
  { kisaltma: "AY", tamAd: "Anayasa", esanlamlar: ["anayasa"] },
];

// Kısaltma normalize edilmiş (küçük harf, noktasız) → gösterim kısaltması
// ⚠ trLower KULLAN, .toLowerCase() DEĞİL — "İİK".toLowerCase() JS'de "İ"yi
// (U+0130) "i" + görünmez birleşen nokta işaretine çevirir, düz "iik" ile
// EŞLEŞMEZ. Bu dosyada bir kez bizzat bu hataya düşüldü (FAZ 1 kanıt scripti
// ile yakalandı) — bkz. bedesten.ts:trLower.
export const KISALTMA_HARITASI: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const k of KANUNLAR) {
    const normKisaltma = trLower(k.kisaltma).replace(/\./g, "").replace(/\s+/g, "");
    m[normKisaltma] = k.kisaltma;
    for (const es of k.esanlamlar) {
      m[trLower(es).replace(/\s+/g, " ").trim()] = k.kisaltma;
    }
  }
  return m;
})();

/**
 * "icra" gibi bir kavramdan kanun ÇIKARIMI — yalnızca çok net, tek kanuna işaret
 * eden kavramlar için. Belirsizse ekleme (ör. "sözleşme" hem TBK hem TTK'da olabilir
 * — buraya alınmadı, filtreleme yapılmaz).
 */
export const KAVRAMDAN_KANUN: Record<string, string> = {
  icra: "İİK",
  iflas: "İİK",
  haciz: "İİK",
  yediemin: "İİK",
  boşanma: "TMK",
  velayet: "TMK",
  nafaka: "TMK",
  miras: "TMK",
  vasiyetname: "TMK",
  kira: "TBK",
  tahliye: "TBK",
  tazminat: "TBK",
  vekalet: "TBK",
  dava: "HMK",
  ihtiyati: "HMK",
  hırsızlık: "TCK",
  dolandırıcılık: "TCK",
  cinsel: "TCK",
  gözaltı: "CMK",
  tutuklama: "CMK",
  şirket: "TTK",
  çek: "TTK",
  bono: "TTK",
  iptal: "İYUK",
  işçi: "İş K.",
  kıdem: "İş K.",
  ihbar: "İş K.",
};
