// Kavram → kanun maddesi haritası.
//
// ⚠ DÜRÜSTLÜK NOTU: Bu harita sorgu ZENGİNLEŞTİRME için kullanılır (Bedesten'e
// gönderilen ek arama varyantı üretir), sonucu FİLTRELEMEZ/ELEMEZ — yanlış bir
// eşleme olsa bile kullanıcı orijinal sorgusunun sonucunu her zaman görür.
// Yine de yalnızca YÜKSEK GÜVENLE bildiğim, tartışmasız ve TEK maddeye işaret eden
// kavramlar eklendi (~15 adet). Aşağıdaki HER SATIR FAZ 1 raporunda ayrıca
// listelenmiştir — Av. Şeyma bunları teyit etmeden "kesin doğru" sayılmamalıdır.
// Emin olmadığım (velayet, miras reddi, ortaklığın giderilmesi, ecrimisil, tenkis
// gibi birden çok/geniş madde aralığına yayılan) kavramlar BİLİNÇLİ OLARAK
// eklenmedi.

export interface KavramMadde {
  kavram: string;
  kanun: string;
  madde: string;
}

export const KAVRAM_MADDE_HARITASI: KavramMadde[] = [
  { kavram: "yediemin", kanun: "İİK", madde: "88" },
  { kavram: "menfi tespit", kanun: "İİK", madde: "72" },
  { kavram: "itirazın iptali", kanun: "İİK", madde: "67" },
  { kavram: "itirazın kaldırılması", kanun: "İİK", madde: "68" },
  { kavram: "ihtiyati haciz", kanun: "İİK", madde: "257" },
  { kavram: "boşanma", kanun: "TMK", madde: "166" },
  { kavram: "yoksulluk nafakası", kanun: "TMK", madde: "175" },
  { kavram: "önalım", kanun: "TMK", madde: "732" },
  { kavram: "kira temerrüdü tahliye", kanun: "TBK", madde: "315" },
  { kavram: "ihtiyaç nedeniyle tahliye", kanun: "TBK", madde: "350" },
  { kavram: "haksız fiil tazminatı", kanun: "TBK", madde: "49" },
  { kavram: "manevi tazminat", kanun: "TBK", madde: "56" },
  { kavram: "hırsızlık", kanun: "TCK", madde: "141" },
  { kavram: "dolandırıcılık", kanun: "TCK", madde: "157" },
  { kavram: "tehdit", kanun: "TCK", madde: "106" },
  { kavram: "hakaret", kanun: "TCK", madde: "125" },
];

export function kavramMaddeBul(kavram: string): KavramMadde | null {
  const k = kavram.toLowerCase().trim();
  return KAVRAM_MADDE_HARITASI.find((x) => x.kavram === k) ?? null;
}
