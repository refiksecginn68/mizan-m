// Hesaplama motoru ortak tipleri. UI'dan bağımsız, saf TypeScript.
// Her hesaplama kalemi "nasıl hesaplandı" formülünü taşır (şeffaflık zorunlu).

export interface HesapKalemi {
  ad: string;
  tutar: number; // TL
  formul: string; // "50.000 × ‰5" gibi insan-okur açıklama
  not?: string;
}

export interface HesapSonucu {
  kalemler: HesapKalemi[];
  toplam: number;
  uyarilar: string[];
  // Hangi tarife yılı kullanıldı — çıktı denetlenebilir olsun
  tarifeYili: number;
}

// Tüm sonuçlarda görünecek ortak yasal uyarı
export const GENEL_UYARI =
  "Bu hesaplama bilgilendirme amaçlıdır; resmi hesap ilgili icra müdürlüğü/mahkemece yapılır.";
