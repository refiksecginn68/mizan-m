// ⚠ TARİFE DEĞERLERİ — 2026.
// Kural: değerler hafızadan yazılmaz; resmi/güncel kaynaktan doğrulanır.
// Doğrulanamayan her değer `dogrulanmadi: true` ile işaretlenir ve raporda listelenir.
// 2027 eklenince bu dosyanın kopyası 2027.ts olarak açılır; kod değişmez (yıl seçilir).

export interface Dogrulanabilir<T> {
  deger: T;
  kaynak: string;
  dogrulanmadi: boolean;
}

function v<T>(deger: T, kaynak: string): Dogrulanabilir<T> {
  return { deger, kaynak, dogrulanmadi: false };
}
function suphe<T>(deger: T, kaynak: string): Dogrulanabilir<T> {
  return { deger, kaynak, dogrulanmadi: true };
}

export const TARIFE_2026 = {
  YIL: 2026,
  GECERLILIK_TARIHI: "2026-01-01",
  KAYNAK_NOT:
    "Harç maktu tutarları Harçlar Kanunu Genel Tebliği (Seri No: 98, RG 31.12.2025 mük. s.33124) ile 01.01.2026'dan itibaren %18,95 yeniden değerleme oranında artışlı. Faiz oranları TCMB/BKK tebliğlerine tabidir.",
  RESMI_KAYNAK_URL: "https://www.mevzuat.gov.tr/MevzuatMetin/1.5.492.pdf",

  // --- İCRA HARÇLARI (492 sayılı Harçlar Kanunu, (1) sayılı tarife) ---
  icra: {
    // İcraya başvurma harcı (maktu)
    basvurmaHarci: suphe(732, "2026 yargı harçları tarifesi (tek kaynak, resmi tebliğ ile teyit edilmeli)"),
    // Peşin harç: SADECE ilamsız/kambiyoda, ana para üzerinden ‰5
    pesinHarcOrani: v(0.005, "492 s.K. — ilamsız takipte peşin harç binde 5 (prompt spec + genel uygulama)"),
    // MTS: peşin harç yerine ana para üzerinden %2
    mtsHarcOrani: v(0.02, "MTS başvuru harcı %2 (prompt spec)"),
    // Tahsil harcı — aşamaya göre
    tahsilHarci: {
      tebligSonrasiHacizOncesi: v(0.0455, "İcra tahsil harcı %4,55 (492 s.K. (1) sayılı tarife)"),
      hacizSonrasiSatisOncesi: v(0.091, "İcra tahsil harcı %9,10"),
      satisSonrasi: v(0.1138, "İcra tahsil harcı %11,38"),
    },
    // Cezaevi harcı (2548 s.K.) — tahsil harcı matrahına oran
    cezaeviHarciOrani: suphe(0.02, "Cezaevi yapı harcı oranı — resmi kaynakla teyit edilmeli"),
    // Vekalet suret (vekalet pulu) — maktu
    vekaletPulu: suphe(64.4, "Vekalet suret harcı 2026 — teyit edilmeli"),
    // Baro pulu (avukatlık makbuz/baro payı) — maktu
    baroPulu: suphe(0, "Baro pulu tutarı baroya göre değişir — kullanıcı girmeli"),
    // Tebligat / gider avansı — borçlu başına (değişken; kullanıcı düzenleyebilir)
    tebligatGideriBorcluBasina: suphe(500, "Tebligat/PTT gideri tahmini — güncel PTT tarifesiyle teyit edilmeli"),
  },

  // --- FAİZ ORANLARI (yıllık) ---
  faiz: {
    yasalFaiz: v(0.09, "3095 s.K. kanuni faiz %9 (istikrarlı BKK oranı)"),
    avansFaizi: suphe(0.4575, "TCMB avans faizi — kaynaklar çelişkili, TCMB tebliğiyle teyit edilmeli"),
    ticariTemerrutFaizi: suphe(0.4875, "Ticari temerrüt (reeskont+8 puan) — TCMB tebliğiyle teyit edilmeli"),
  },

  // --- İŞÇİLİK ---
  iscilik: {
    // Kıdem tazminatı tavanı — dönemsel (en yüksek devlet memuru emeklilik ikramiyesi)
    kidemTavani: {
      h1: v(64948.77, "Kıdem tavanı 01.01–30.06.2026 (PwC/Verginet)"),
      h2: v(73729.87, "Kıdem tavanı 01.07–31.12.2026 (Verginet SGK 2026-23)"),
    },
  },

  // --- AVUKATLIK ASGARİ ÜCRET TARİFESİ (2025-2026, RG 04.11.2025) ---
  aaut: {
    icraMaktuGenel: v(9000, "AAÜT 2026 icra takibi maktu (barobirlik.org.tr)"),
    icraMaktuTahliye: v(20000, "AAÜT 2026 tahliye icra takibi maktu (TBB karşılaştırma cetveli, İkinci Kısım/İkinci Bölüm md.4)"),
    // Nispi tarife (Üçüncü Kısım) — TBB resmi 2026 cetvelinin tam 10 dilimi doğrulandı.
    // ustSinir: kümülatif üst sınır; her dilime kendi marjinal oranı uygulanır.
    nispiDilimler: v(
      [
        { ustSinir: 600000, oran: 0.16 },
        { ustSinir: 1200000, oran: 0.15 },
        { ustSinir: 2400000, oran: 0.14 },
        { ustSinir: 3600000, oran: 0.13 },
        { ustSinir: 5400000, oran: 0.11 },
        { ustSinir: 7800000, oran: 0.08 },
        { ustSinir: 10800000, oran: 0.05 },
        { ustSinir: 14400000, oran: 0.03 },
        { ustSinir: 18600000, oran: 0.02 },
        { ustSinir: Infinity, oran: 0.01 },
      ],
      "AAÜT 2026 Üçüncü Kısım — TBB resmi karşılaştırma cetveli (d.barobirlik.org.tr/2025/20251103_tbbtablo_karsilastirmacetveli.pdf, RG 04.11.2025 s.33067)"
    ),
  },
} as const;

export type Tarife = typeof TARIFE_2026;
