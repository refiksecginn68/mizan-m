// Dilekçe şablon korpusu — ortak tipler.
//
// TELİF: Tüm şablonlar SIFIRDAN ÖZGÜN yazılmıştır. Corpus.com.tr, Lexpera vb.
// ticari/telifli platformlardan hiçbir metin kopyalanmamıştır. Dilekçenin YAPISI
// (başlık/taraflar/açıklamalar/hukuki sebepler/sonuç-talep) HMK usul kuralıdır ve
// serbesttir; somut cümleler bu projede özgün olarak üretilmiştir.

export interface DilekceSablonu {
  id: string;
  kategori: SablonKategori;
  baslik: string;
  aciklama: string;
  /** Uyuşmazlığın konusu — ör. "Kıdem tazminatı alacağı" */
  davaTuru: string;
  /** Belgenin usul içindeki rolü — ör. "Dava dilekçesi", "Cevap dilekçesi" */
  dilekceTipi: string;
  /** Görevli/yetkili merci — ör. "İş Mahkemesi" */
  yetkiliMahkeme: string;
  /** İçeriğin kökeni: özgün üretim / kamuya açık içtihat / resmî form */
  kaynak: "ozgun" | "ictihat" | "resmi";
  icerik: string;
}

export const SABLON_KATEGORILERI = [
  "İş Hukuku",
  "Aile Hukuku",
  "İcra ve İflas",
  "Ceza Hukuku",
  "Tazminat",
  "Kira ve Gayrimenkul",
  "Tüketici",
  "İdari",
  "Sözleşme",
  "Kanun Yolu",
  "Başvuru / Talep",
] as const;

export type SablonKategori = (typeof SABLON_KATEGORILERI)[number];

export const IMZA_BLOGU = `[TARİH]

Davacı Vekili
Av. [AD SOYAD]
(e-imzalıdır)`;

export const IMZA_BLOGU_DAVALI = `[TARİH]

Davalı Vekili
Av. [AD SOYAD]
(e-imzalıdır)`;
