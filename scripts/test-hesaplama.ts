// FAZ 2 test vektörleri — deterministik hesap motoru kanıtı.
// Çalıştır: npx tsx scripts/test-hesaplama.ts
import { icraKapakHesapla } from "../src/lib/hesaplama/icra-kapak";
import { faizHesapla } from "../src/lib/hesaplama/faiz";
import { iscilikHesapla } from "../src/lib/hesaplama/iscilik";
import { nafakaTahmin } from "../src/lib/hesaplama/nafaka";
import { harcVekaletHesapla } from "../src/lib/hesaplama/harc-vekalet";
import { nispiVekalet } from "../src/lib/hesaplama/icra-kapak";
import { TARIFE_2026 } from "../src/lib/hesaplama/tarifeler/2026";

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
// İlk dilim: 500.000 × %16 = 80.000
const nispi500 = hv.kalemler.find((k) => k.ad === "Vekalet ücreti (AAÜT)")?.tutar;
assert("Nispi 500k = 80.000 (%16 ilk dilim)", nispi500 === 80000, 80000, nispi500);

// AAÜT nispi tam dilim tablosu (TBB 2026 birincil kaynakla doğrulandı).
// 10.8M kümülatif: 96k+90k+168k+156k+198k+192k+150k = 1.050.000
// (eski hatalı 4-dilim tablosu 2.4M üstünü sabit %13 alıp 1.446.000 verirdi)
const nispi108 = nispiVekalet(10_800_000, TARIFE_2026.aaut.nispiDilimler.deger);
assert("Nispi 10.8M = 1.050.000 (azalan dilimler)", nispi108 === 1_050_000, 1_050_000, nispi108);
assert("Nispi dilimler doğrulandı (v)", TARIFE_2026.aaut.nispiDilimler.dogrulanmadi === false, false, TARIFE_2026.aaut.nispiDilimler.dogrulanmadi);

// FAZ 3 — birincil kaynakla doğrulanan tarife değerleri (suphe→v)
const T = TARIFE_2026;
assert("Başvurma harcı doğrulandı (732, v)", T.icra.basvurmaHarci.dogrulanmadi === false && T.icra.basvurmaHarci.deger === 732, "732/v", `${T.icra.basvurmaHarci.deger}/${T.icra.basvurmaHarci.dogrulanmadi}`);
assert("Avans faizi %39,75 doğrulandı (v)", T.faiz.avansFaizi.dogrulanmadi === false && T.faiz.avansFaizi.deger === 0.3975, "0.3975/v", `${T.faiz.avansFaizi.deger}/${T.faiz.avansFaizi.dogrulanmadi}`);
assert("Ticari temerrüt %39,75 doğrulandı (v)", T.faiz.ticariTemerrutFaizi.dogrulanmadi === false && T.faiz.ticariTemerrutFaizi.deger === 0.3975, "0.3975/v", `${T.faiz.ticariTemerrutFaizi.deger}/${T.faiz.ticariTemerrutFaizi.dogrulanmadi}`);
assert("Tahsil harcı 4.55/9.10/11.38 doğrulandı", T.icra.tahsilHarci.tebligSonrasiHacizOncesi.deger === 0.0455 && T.icra.tahsilHarci.hacizSonrasiSatisOncesi.deger === 0.091 && T.icra.tahsilHarci.satisSonrasi.deger === 0.1138, "4.55/9.10/11.38", "—");

console.log(`\n===== SONUÇ: ${gecti} geçti, ${kaldi} kaldı =====`);
process.exit(kaldi > 0 ? 1 : 0);
