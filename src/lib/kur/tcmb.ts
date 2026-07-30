// TCMB günlük kur — SERVER-SIDE. Client'tan TCMB'ye doğrudan istek atılmaz.
// Cache: Next fetch revalidate ~1 saat. TCMB hafta sonu/tatilde güncellenmez;
// veri bayatsa dürüstçe "son yayınlanan kur" olarak işaretlenir.

export interface Kur {
  kod: string;
  isim: string;
  alis: number | null; // döviz alış (ForexBuying)
  satis: number | null; // döviz satış (ForexSelling)
  efektifAlis: number | null; // BanknoteBuying
  efektifSatis: number | null; // BanknoteSelling
}

export interface KurSonucu {
  ok: boolean;
  tarih: string | null; // "29.07.2026"
  bayat: boolean; // bugünün tarihi değilse true
  kurlar: Kur[];
  hata?: string;
}

const ISTENEN = ["USD", "EUR", "GBP", "CHF"] as const;

function sayi(blok: string, etiket: string): number | null {
  const m = blok.match(new RegExp(`<${etiket}>([\\d.]+)</${etiket}>`));
  return m ? parseFloat(m[1]) : null;
}

function bugunTR(): string {
  const d = new Date();
  const g = String(d.getDate()).padStart(2, "0");
  const a = String(d.getMonth() + 1).padStart(2, "0");
  return `${g}.${a}.${d.getFullYear()}`;
}

export async function tcmbKurGetir(): Promise<KurSonucu> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 3600 }, // ~1 saat cache
    });
    if (!res.ok) {
      return { ok: false, tarih: null, bayat: true, kurlar: [], hata: `TCMB yanıtı ${res.status}` };
    }
    const xml = await res.text();
    const tarih = xml.match(/Tarih="([\d.]+)"/)?.[1] ?? null;

    const kurlar: Kur[] = [];
    for (const kod of ISTENEN) {
      const blok = xml.match(new RegExp(`<Currency[^>]*Kod="${kod}"[\\s\\S]*?</Currency>`))?.[0];
      if (!blok) continue;
      const isim = blok.match(/<Isim>([^<]+)<\/Isim>/)?.[1]?.trim() ?? kod;
      kurlar.push({
        kod,
        isim,
        alis: sayi(blok, "ForexBuying"),
        satis: sayi(blok, "ForexSelling"),
        efektifAlis: sayi(blok, "BanknoteBuying"),
        efektifSatis: sayi(blok, "BanknoteSelling"),
      });
    }

    if (kurlar.length === 0) {
      return { ok: false, tarih, bayat: true, kurlar: [], hata: "Kur verisi ayrıştırılamadı" };
    }

    return { ok: true, tarih, bayat: tarih !== bugunTR(), kurlar };
  } catch (e) {
    // Fetch hatasında sayfa çökmesin — kur bloğu kendi hatasını gösterir
    return { ok: false, tarih: null, bayat: true, kurlar: [], hata: e instanceof Error ? e.message : "Ağ hatası" };
  }
}
