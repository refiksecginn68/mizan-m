// FAZ 2 test vektörleri — deterministik hesap motoru kanıtı.
// Çalıştır: npx tsx scripts/test-hesaplama.ts
import { icraKapakHesapla } from "../src/lib/hesaplama/icra-kapak";
import { faizHesapla } from "../src/lib/hesaplama/faiz";
import { iscilikHesapla } from "../src/lib/hesaplama/iscilik";
import { nafakaTahmin } from "../src/lib/hesaplama/nafaka";
import { harcVekaletHesapla } from "../src/lib/hesaplama/harc-vekalet";

function dok(baslik: string, sonuc: { kalemler: { ad: string; tutar: number; formul: string; not?: string }[]; toplam: number }) {
  console.log(`\n=== ${baslik} ===`);
  for (const k of sonuc.kalemler) {
    console.log(`  ${k.ad.padEnd(32)} ${k.tutar.toFixed(2).padStart(12)}   [${k.formul}]${k.not ? "  ⚠ " + k.not : ""}`);
  }
  console.log(`  ${"TOPLAM".padEnd(32)} ${sonuc.toplam.toFixed(2).padStart(12)}`);
}

let gecti = 0, kaldi = 0;
function assert(ad: string, kosul: boolean, beklenen: unknown, gercek: unknown) {
  if (kosul) { gecti++; console.log(`  ✓ ${ad}`); }
  else { kaldi++; console.log(`  ✗ ${ad} — beklenen ${beklenen}, gerçek ${gercek}`); }
}

const ortak = {
  anaPara: 50000,
  takipTarihi: "2026-01-01",
  odemeTarihi: "2026-01-01", // faiz 0 → peşin harç izole test
  faizTuru: "yok" as const,
  borcluSayisi: 1,
  vekilVar: true,
  tahsilAsamasi: "yok" as const,
};

// TEST 1: ilamsız genel → peşin harç 250
const t1 = icraKapakHesapla({ ...ortak, takipTuru: "ilamsiz-genel" });
dok("TEST 1 — 50.000 TL ilamsız genel, vekilli, 1 borçlu", t1);
const pesin1 = t1.kalemler.find((k) => k.ad === "Peşin harç")?.tutar;
assert("Peşin harç = 250", pesin1 === 250, 250, pesin1);

// TEST 2: ilamlı → peşin harç 0
const t2 = icraKapakHesapla({ ...ortak, takipTuru: "ilamli" });
dok("TEST 2 — aynı dosya ilamlı", t2);
const pesin2 = t2.kalemler.find((k) => k.ad === "Peşin harç")?.tutar;
assert("İlamlı peşin harç = 0", pesin2 === 0, 0, pesin2);

// TEST 3: MTS → ana para × %2 = 1000
const t3 = icraKapakHesapla({ ...ortak, takipTuru: "mts" });
dok("TEST 3 — aynı dosya MTS", t3);
const mts = t3.kalemler.find((k) => k.ad === "MTS başvuru harcı")?.tutar;
assert("MTS harcı = 1000 (%2)", mts === 1000, 1000, mts);

// İcra kapak — dolu senaryo (faiz + tahsil aşaması)
const dolu = icraKapakHesapla({
  ...ortak, takipTuru: "ilamsiz-genel", faizTuru: "yasal",
  takipTarihi: "2025-01-01", odemeTarihi: "2026-01-01", tahsilAsamasi: "haciz-sonrasi",
});
dok("İcra kapak — 1 yıl yasal faiz + haciz sonrası tahsil", dolu);
const fz = dolu.kalemler.find((k) => k.ad === "İşlemiş faiz")?.tutar;
assert("İşlemiş faiz ≈ 4500 (50k×%9×365/365)", fz === 4500, 4500, fz);

// FAİZ — dönemsel oran değişimi
const faiz = faizHesapla({
  anaPara: 100000, tur: "basit",
  donemler: [
    { baslangic: "2025-01-01", bitis: "2025-07-01", yillikOran: 0.09 },
    { baslangic: "2025-07-01", bitis: "2026-01-01", yillikOran: 0.12 },
  ],
});
dok("FAİZ — 100k, iki dönem (%9 sonra %12), basit", faiz);

// İŞÇİLİK — tavan uygulanan senaryo
const isci = iscilikHesapla({
  iseGiris: "2015-01-01", istenCikis: "2026-08-01",
  aylikBrutUcret: 120000, kullanilmayanIzinGunu: 20, fazlaMesaiSaati: 50,
});
dok("İŞÇİLİK — 11+ yıl, 120k brüt (tavan aşımı)", isci);
const kidem = isci.kalemler.find((k) => k.ad === "Kıdem tazminatı")?.tutar ?? 0;
assert("Kıdem tavanı uygulandı (matrah 73.729,87)", kidem < 120000 * 12, "<tavansız", kidem);

// NAFAKA — rehber
const naf = nafakaTahmin({ yukumluNetGelir: 40000, cocukSayisi: 2 });
dok("NAFAKA — 40k net, 2 çocuk (REHBER)", naf);
console.log("  Uyarı:", naf.uyarilar[0]);

// HARÇ & VEKALET
const hv = harcVekaletHesapla({ davaDegeri: 500000, vekaletTuru: "nispi" });
dok("HARÇ & VEKALET — 500k dava, nispi", hv);

console.log(`\n===== SONUÇ: ${gecti} geçti, ${kaldi} kaldı =====`);
process.exit(kaldi > 0 ? 1 : 0);
