// FAZ 3 "Dosya modu": UYAP dava dosyasının evrak metinlerinden emsal arama
// sorgusu üretir. LLM/AI çağrısı YOK — mevcut karar-chunker.ts madde-atfı
// çıkarımının (FAZ 2.2) dosya bağlamına yeniden kullanımı (bkz. memory
// faz3-dosya-modu-tasarim). Yeni DB kolonu/endpoint gerektirmez.

import { documentMaddeleriCikar } from "@/lib/arama/karar-chunker";
import { maddeAtfindanTerim } from "@/lib/arama/query-parser";

/**
 * Evrak metinlerini birleştirip en belirgin madde atfını arama sorgusuna
 * çevirir; madde atfı bulunamazsa dava türünü kullanır. İkisi de yoksa null
 * döner (UI bunu "sorgu üretilemedi" olarak göstermeli).
 */
export function dosyaEmsalSorgusuUret(
  evrakMetinleri: Record<string, string> | null | undefined,
  davaTuru: string | null | undefined
): string | null {
  const birlesikMetin = Object.values(evrakMetinleri ?? {}).filter(Boolean).join("\n");

  if (birlesikMetin) {
    const atiflar = documentMaddeleriCikar(birlesikMetin);
    // Metinde geçen İLK madde atfı — evraklarda genellikle iddianame/dava
    // dilekçesi en erken sırada olur, o da davanın ana hukuki dayanağını taşır.
    const ilkAtfi = atiflar[0];
    if (ilkAtfi) {
      const terim = maddeAtfindanTerim(ilkAtfi);
      if (terim) return terim;
    }
  }

  if (davaTuru?.trim()) return davaTuru.trim();
  return null;
}
