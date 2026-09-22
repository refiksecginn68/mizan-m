// Kavram eşanlam sözlüğü — sorgu genişletme için.
//
// ⚠ DÜRÜSTLÜK NOTU: Spesifikasyon ~150 terim istiyordu. Uydurmamak için yalnızca
// yüksek güvenle bildiğim, Türk hukuk pratiğinde standart kabul edilen ~50 grup
// yazıldı. Genişletme, bu dosyaya yeni satır eklemekle yapılır — liste FAZ 1
// raporunda tam olarak sayılmıştır, Av. Şeyma kontrol edebilir.

export interface KavramGrubu {
  /** Grubun temsilci (birincil) terimi */
  ana: string;
  esanlamlar: string[];
}

export const KAVRAM_GRUPLARI: KavramGrubu[] = [
  { ana: "yediemin", esanlamlar: ["yedieminlik", "muhafaza memuru", "yed-i emin"] },
  { ana: "tahliye", esanlamlar: ["mecurun tahliyesi", "kiralananın tahliyesi", "tahliye davası"] },
  { ana: "ihtarname", esanlamlar: ["ihtar", "ihtarname keşidesi"] },
  { ana: "menfi tespit", esanlamlar: ["borçlu olmadığının tespiti", "menfi tespit davası"] },
  { ana: "haciz", esanlamlar: ["hacze iştirak", "haczedilmezlik"] },
  { ana: "icra takibi", esanlamlar: ["icra takibine itiraz", "ilamsız takip", "ilamlı takip"] },
  { ana: "boşanma", esanlamlar: ["boşanma davası", "anlaşmalı boşanma", "çekişmeli boşanma"] },
  { ana: "velayet", esanlamlar: ["velayetin değiştirilmesi", "velayet düzenlemesi"] },
  { ana: "nafaka", esanlamlar: ["yoksulluk nafakası", "iştirak nafakası", "tedbir nafakası"] },
  { ana: "kıdem tazminatı", esanlamlar: ["kıdem tazminatı alacağı"] },
  { ana: "ihbar tazminatı", esanlamlar: ["ihbar öneli", "ihbar tazminatı alacağı"] },
  { ana: "işe iade", esanlamlar: ["işe iade davası", "haksız fesih"] },
  { ana: "manevi tazminat", esanlamlar: ["manevi tazminat davası"] },
  { ana: "maddi tazminat", esanlamlar: ["maddi tazminat davası", "zarar tazmini"] },
  { ana: "trafik kazası", esanlamlar: ["trafik kazası tazminatı", "araç hasarı"] },
  { ana: "miras", esanlamlar: ["mirasın reddi", "mirasçılık belgesi", "tereke"] },
  { ana: "vasiyetname", esanlamlar: ["vasiyetnamenin iptali", "el yazılı vasiyet"] },
  { ana: "tenkis", esanlamlar: ["tenkis davası", "saklı pay"] },
  { ana: "ecrimisil", esanlamlar: ["haksız işgal tazminatı"] },
  { ana: "kamulaştırma", esanlamlar: ["kamulaştırma bedeli", "kamulaştırmasız el atma"] },
  { ana: "önalım", esanlamlar: ["şufa hakkı", "önalım davası"] },
  { ana: "kat mülkiyeti", esanlamlar: ["kat malikleri", "yönetim planı"] },
  { ana: "ortaklığın giderilmesi", esanlamlar: ["izale-i şüyu", "paydaşlığın giderilmesi"] },
  { ana: "tapu iptali", esanlamlar: ["tapu iptal tescil", "muvazaa"] },
  { ana: "sözleşmenin feshi", esanlamlar: ["sözleşme iptali", "akdin feshi"] },
  { ana: "cayma hakkı", esanlamlar: ["sözleşmeden cayma"] },
  { ana: "ayıplı mal", esanlamlar: ["ayıplı hizmet", "garanti belgesi"] },
  { ana: "hırsızlık", esanlamlar: ["hırsızlık suçu", "nitelikli hırsızlık"] },
  { ana: "dolandırıcılık", esanlamlar: ["nitelikli dolandırıcılık"] },
  { ana: "tehdit", esanlamlar: ["tehdit suçu"] },
  { ana: "hakaret", esanlamlar: ["hakaret suçu", "sövme"] },
  { ana: "gözaltı", esanlamlar: ["gözaltına alma", "yakalama"] },
  { ana: "tutuklama", esanlamlar: ["tutuklama kararı", "tutukluluğun devamı"] },
  { ana: "adli kontrol", esanlamlar: ["adli kontrol tedbiri"] },
  { ana: "kovuşturmaya yer olmadığı", esanlamlar: ["kyok", "takipsizlik kararı"] },
  { ana: "beraat", esanlamlar: ["beraat kararı"] },
  { ana: "istinaf", esanlamlar: ["istinaf başvurusu", "istinaf kanun yolu"] },
  { ana: "temyiz", esanlamlar: ["temyiz başvurusu", "temyiz kanun yolu"] },
  { ana: "yargılamanın yenilenmesi", esanlamlar: ["muhakemenin iadesi"] },
  { ana: "ihtiyati tedbir", esanlamlar: ["tedbir kararı"] },
  { ana: "ihtiyati haciz", esanlamlar: ["ihtiyati haciz kararı"] },
  { ana: "delil tespiti", esanlamlar: ["tespit davası"] },
  { ana: "bilirkişi raporu", esanlamlar: ["bilirkişi incelemesi"] },
  { ana: "vekalet ücreti", esanlamlar: ["avukatlık ücreti"] },
  { ana: "yargılama gideri", esanlamlar: ["yargılama masrafı", "harç"] },
  { ana: "iş kazası", esanlamlar: ["iş kazası tazminatı", "meslek hastalığı"] },
  { ana: "mobbing", esanlamlar: ["psikolojik taciz", "işyerinde bezdirme"] },
  { ana: "fazla mesai", esanlamlar: ["fazla çalışma ücreti"] },
  { ana: "kişisel veri ihlali", esanlamlar: ["veri ihlali", "kvkk ihlali"] },
  { ana: "marka hakkı", esanlamlar: ["marka tecavüzü", "marka ihlali"] },
];

/** Bir terimin ait olduğu grubu bulur (ana terim veya eşanlamlarından biri geçerse). */
export function kavramGrubuBul(terim: string): KavramGrubu | null {
  const t = terim.toLowerCase().trim();
  return (
    KAVRAM_GRUPLARI.find(
      (g) => g.ana === t || g.esanlamlar.some((e) => e === t)
    ) ?? null
  );
}
