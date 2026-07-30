"use client";

import { useState } from "react";
import { Copy, Printer, Calculator, Percent, Scale, Briefcase, HeartHandshake, TrendingUp, FileStack } from "lucide-react";
import {
  icraKapakHesapla, faizHesapla, iscilikHesapla, nafakaTahmin, harcVekaletHesapla,
  type HesapSonucu, type TakipTuru, type TahsilAsamasi, type FaizTuru,
} from "@/lib/hesaplama";
import type { Kur } from "@/lib/kur/tcmb";
import Donusturucu from "./Donusturucu";

const SEKMELER = [
  { id: "icra", ad: "İcra Kapak", ikon: Calculator },
  { id: "faiz", ad: "Faiz", ikon: Percent },
  { id: "harc", ad: "Harç & Vekalet", ikon: Scale },
  { id: "iscilik", ad: "İşçilik", ikon: Briefcase },
  { id: "nafaka", ad: "Nafaka", ikon: HeartHandshake },
  { id: "kur", ad: "Kur & Piyasa", ikon: TrendingUp },
  { id: "donusturucu", ad: "Dönüştürücü", ikon: FileStack },
] as const;
type SekmeId = (typeof SEKMELER)[number]["id"];

const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SonucKart({ sonuc, baslik }: { sonuc: HesapSonucu; baslik: string }) {
  function panoyaKopyala() {
    const satirlar = sonuc.kalemler.map((k) => `${k.ad}: ${fmt(k.tutar)} TL  (${k.formul})`);
    const metin = [baslik, ...satirlar, `TOPLAM: ${fmt(sonuc.toplam)} TL`, "", ...sonuc.uyarilar].join("\n");
    navigator.clipboard.writeText(metin);
  }
  return (
    <div className="mt-6 bg-white rounded-2xl border border-border shadow-card overflow-hidden print:shadow-none">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="font-heading text-base font-bold text-primary">{baslik}</h3>
        <div className="flex gap-2 print:hidden">
          <button onClick={panoyaKopyala} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
            <Copy className="w-3.5 h-3.5" /> Panoya kopyala
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
            <Printer className="w-3.5 h-3.5" /> PDF / Yazdır
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {sonuc.kalemler.map((k, i) => (
          <div key={i} className="px-5 py-2.5 flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">{k.ad}</p>
              <p className="text-[11px] text-gray-400">{k.formul}{k.not ? ` · ${k.not}` : ""}</p>
            </div>
            <span className="text-sm font-semibold text-primary tabular-nums flex-shrink-0">{fmt(k.tutar)} TL</span>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 bg-[#0f1729] flex items-center justify-between">
        <span className="text-sm font-semibold text-white/70">TOPLAM</span>
        <span className="text-lg font-bold text-[#c9a84c] tabular-nums">{fmt(sonuc.toplam)} TL</span>
      </div>
      <div className="px-5 py-3 space-y-1">
        {sonuc.uyarilar.map((u, i) => (
          <p key={i} className="text-[11px] text-amber-700 leading-snug">⚠ {u}</p>
        ))}
      </div>
    </div>
  );
}

// Ortak form alan bileşenleri
function Alan({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/40";

// ---------- İCRA KAPAK ----------
function IcraForm() {
  const [f, setF] = useState({
    takipTuru: "ilamsiz-genel" as TakipTuru, anaPara: 50000,
    takipTarihi: "2026-01-01", odemeTarihi: "2026-07-29",
    faizTuru: "yok" as FaizTuru, ozelFaizOrani: 30,
    borcluSayisi: 1, vekilVar: true, tahsilAsamasi: "yok" as TahsilAsamasi,
  });
  const [sonuc, setSonuc] = useState<HesapSonucu | null>(null);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Alan label="Takip türü">
          <select className={inputCls} value={f.takipTuru} onChange={(e) => setF({ ...f, takipTuru: e.target.value as TakipTuru })}>
            <option value="ilamsiz-genel">İlamsız — genel</option>
            <option value="ilamsiz-kambiyo">İlamsız — kambiyo</option>
            <option value="ilamli">İlamlı</option>
            <option value="mts">MTS</option>
          </select>
        </Alan>
        <Alan label="Ana para (TL)"><input type="number" className={inputCls} value={f.anaPara} onChange={(e) => setF({ ...f, anaPara: +e.target.value })} /></Alan>
        <Alan label="Takip tarihi"><input type="date" className={inputCls} value={f.takipTarihi} onChange={(e) => setF({ ...f, takipTarihi: e.target.value })} /></Alan>
        <Alan label="Ödeme/hesap tarihi"><input type="date" className={inputCls} value={f.odemeTarihi} onChange={(e) => setF({ ...f, odemeTarihi: e.target.value })} /></Alan>
        <Alan label="Faiz türü">
          <select className={inputCls} value={f.faizTuru} onChange={(e) => setF({ ...f, faizTuru: e.target.value as FaizTuru })}>
            <option value="yok">Faiz yok</option>
            <option value="yasal">Yasal faiz</option>
            <option value="avans">Avans faizi</option>
            <option value="ticari">Ticari temerrüt</option>
            <option value="ozel">Özel oran</option>
          </select>
        </Alan>
        {f.faizTuru === "ozel" && (
          <Alan label="Özel faiz (%/yıl)"><input type="number" className={inputCls} value={f.ozelFaizOrani} onChange={(e) => setF({ ...f, ozelFaizOrani: +e.target.value })} /></Alan>
        )}
        <Alan label="Borçlu sayısı"><input type="number" min={1} className={inputCls} value={f.borcluSayisi} onChange={(e) => setF({ ...f, borcluSayisi: +e.target.value })} /></Alan>
        <Alan label="Tahsil aşaması">
          <select className={inputCls} value={f.tahsilAsamasi} onChange={(e) => setF({ ...f, tahsilAsamasi: e.target.value as TahsilAsamasi })}>
            <option value="yok">Tahsil yok</option>
            <option value="haciz-oncesi">Tebliğ sonrası — haciz öncesi (%4,55)</option>
            <option value="haciz-sonrasi">Haciz sonrası — satış öncesi (%9,10)</option>
            <option value="satis-sonrasi">Satış sonrası (%11,38)</option>
          </select>
        </Alan>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={f.vekilVar} onChange={(e) => setF({ ...f, vekilVar: e.target.checked })} />
          <span className="text-sm text-gray-700">Vekil var</span>
        </label>
      </div>
      <button
        onClick={() => setSonuc(icraKapakHesapla({ ...f, ozelFaizOrani: f.ozelFaizOrani / 100 }))}
        className="mt-5 bg-[#0f1729] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#0f1729]/90"
      >Hesapla</button>
      {sonuc && <SonucKart sonuc={sonuc} baslik="İcra Kapak Hesabı" />}
    </div>
  );
}

// ---------- FAİZ ----------
function FaizForm() {
  const [f, setF] = useState({ anaPara: 100000, baslangic: "2025-01-01", bitis: "2026-07-29", oran: 9, tur: "basit" as "basit" | "bilesik" });
  const [sonuc, setSonuc] = useState<HesapSonucu | null>(null);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Alan label="Ana para (TL)"><input type="number" className={inputCls} value={f.anaPara} onChange={(e) => setF({ ...f, anaPara: +e.target.value })} /></Alan>
        <Alan label="Yıllık oran (%)"><input type="number" className={inputCls} value={f.oran} onChange={(e) => setF({ ...f, oran: +e.target.value })} /></Alan>
        <Alan label="Başlangıç"><input type="date" className={inputCls} value={f.baslangic} onChange={(e) => setF({ ...f, baslangic: e.target.value })} /></Alan>
        <Alan label="Bitiş"><input type="date" className={inputCls} value={f.bitis} onChange={(e) => setF({ ...f, bitis: e.target.value })} /></Alan>
        <Alan label="Faiz türü">
          <select className={inputCls} value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as "basit" | "bilesik" })}>
            <option value="basit">Basit</option>
            <option value="bilesik">Bileşik</option>
          </select>
        </Alan>
      </div>
      <button
        onClick={() => setSonuc(faizHesapla({ anaPara: f.anaPara, tur: f.tur, donemler: [{ baslangic: f.baslangic, bitis: f.bitis, yillikOran: f.oran / 100 }] }))}
        className="mt-5 bg-[#0f1729] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#0f1729]/90"
      >Hesapla</button>
      {sonuc && <SonucKart sonuc={sonuc} baslik="Faiz Hesabı" />}
    </div>
  );
}

// ---------- HARÇ & VEKALET ----------
function HarcForm() {
  const [f, setF] = useState({ davaDegeri: 500000, vekaletTuru: "nispi" as "nispi" | "maktu" });
  const [sonuc, setSonuc] = useState<HesapSonucu | null>(null);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Alan label="Dava değeri (TL)"><input type="number" className={inputCls} value={f.davaDegeri} onChange={(e) => setF({ ...f, davaDegeri: +e.target.value })} /></Alan>
        <Alan label="Vekalet türü">
          <select className={inputCls} value={f.vekaletTuru} onChange={(e) => setF({ ...f, vekaletTuru: e.target.value as "nispi" | "maktu" })}>
            <option value="nispi">Nispi</option>
            <option value="maktu">Maktu</option>
          </select>
        </Alan>
      </div>
      <button onClick={() => setSonuc(harcVekaletHesapla(f))} className="mt-5 bg-[#0f1729] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#0f1729]/90">Hesapla</button>
      {sonuc && <SonucKart sonuc={sonuc} baslik="Harç & Vekalet Hesabı" />}
    </div>
  );
}

// ---------- İŞÇİLİK ----------
function IscilikForm() {
  const [f, setF] = useState({ iseGiris: "2015-01-01", istenCikis: "2026-08-01", aylikBrutUcret: 60000, kullanilmayanIzinGunu: 0, fazlaMesaiSaati: 0, ihbarKullanildi: false });
  const [sonuc, setSonuc] = useState<HesapSonucu | null>(null);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Alan label="İşe giriş"><input type="date" className={inputCls} value={f.iseGiris} onChange={(e) => setF({ ...f, iseGiris: e.target.value })} /></Alan>
        <Alan label="İşten çıkış"><input type="date" className={inputCls} value={f.istenCikis} onChange={(e) => setF({ ...f, istenCikis: e.target.value })} /></Alan>
        <Alan label="Aylık brüt ücret (TL)"><input type="number" className={inputCls} value={f.aylikBrutUcret} onChange={(e) => setF({ ...f, aylikBrutUcret: +e.target.value })} /></Alan>
        <Alan label="Kullanılmayan izin (gün)"><input type="number" className={inputCls} value={f.kullanilmayanIzinGunu} onChange={(e) => setF({ ...f, kullanilmayanIzinGunu: +e.target.value })} /></Alan>
        <Alan label="Fazla mesai (saat)"><input type="number" className={inputCls} value={f.fazlaMesaiSaati} onChange={(e) => setF({ ...f, fazlaMesaiSaati: +e.target.value })} /></Alan>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={f.ihbarKullanildi} onChange={(e) => setF({ ...f, ihbarKullanildi: e.target.checked })} />
          <span className="text-sm text-gray-700">İhbar öneli kullanıldı (ihbar tazminatı yok)</span>
        </label>
      </div>
      <button onClick={() => setSonuc(iscilikHesapla(f))} className="mt-5 bg-[#0f1729] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#0f1729]/90">Hesapla</button>
      {sonuc && <SonucKart sonuc={sonuc} baslik="İşçilik Alacakları" />}
    </div>
  );
}

// ---------- NAFAKA ----------
function NafakaForm() {
  const [f, setF] = useState({ yukumluNetGelir: 40000, cocukSayisi: 1 });
  const [sonuc, setSonuc] = useState<HesapSonucu | null>(null);
  return (
    <div>
      <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
        Nafaka için bağlayıcı formül yoktur; takdir hâkime aittir (TMK m.4). Aşağıdaki sonuç yalnızca kaba bir tahmindir.
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Alan label="Yükümlü aylık net gelir (TL)"><input type="number" className={inputCls} value={f.yukumluNetGelir} onChange={(e) => setF({ ...f, yukumluNetGelir: +e.target.value })} /></Alan>
        <Alan label="Çocuk sayısı"><input type="number" min={0} className={inputCls} value={f.cocukSayisi} onChange={(e) => setF({ ...f, cocukSayisi: +e.target.value })} /></Alan>
      </div>
      <button onClick={() => setSonuc(nafakaTahmin(f))} className="mt-5 bg-[#0f1729] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#0f1729]/90">Tahmin et</button>
      {sonuc && <SonucKart sonuc={sonuc} baslik="Nafaka Tahmini (rehber)" />}
    </div>
  );
}

// ---------- KUR TABLOSU ----------
function KurTablo({ kurlar, tarih, bayat }: { kurlar: Kur[]; tarih: string | null; bayat: boolean }) {
  if (kurlar.length === 0) return <p className="text-sm text-gray-500">Kur bilgisi şu an alınamıyor.</p>;
  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        {bayat ? `Son yayınlanan kur: ${tarih} (bugün güncellenmedi)` : `Güncel TCMB kuru: ${tarih}`}
      </p>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr><th className="text-left px-4 py-2.5">Döviz</th><th className="text-right px-4 py-2.5">Alış</th><th className="text-right px-4 py-2.5">Satış</th><th className="text-right px-4 py-2.5">Efektif Alış</th><th className="text-right px-4 py-2.5">Efektif Satış</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {kurlar.map((k) => (
              <tr key={k.kod}>
                <td className="px-4 py-2.5 font-semibold text-primary">{k.kod} <span className="text-gray-400 font-normal text-xs">{k.isim}</span></td>
                <td className="px-4 py-2.5 text-right tabular-nums">{k.alis?.toFixed(4) ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{k.satis?.toFixed(4) ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{k.efektifAlis?.toFixed(4) ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{k.efektifSatis?.toFixed(4) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">Kaynak: TCMB günlük bülten. Yabancı para alacaklarında hesaplayıcılara ana para olarak TL karşılığını girin.</p>
    </div>
  );
}

export default function HesaplamaClient({ kurlar, kurTarih, kurBayat }: { kurlar: Kur[]; kurTarih: string | null; kurBayat: boolean }) {
  const [aktif, setAktif] = useState<SekmeId>("icra");
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide bg-white border border-border rounded-xl p-1 mb-6 print:hidden">
        {SEKMELER.map((s) => (
          <button key={s.id} onClick={() => setAktif(s.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap font-body text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors ${aktif === s.id ? "bg-[#0f1729] text-white" : "text-gray-500 hover:text-[#0f1729]"}`}>
            <s.ikon className="w-4 h-4" /> {s.ad}
          </button>
        ))}
      </div>
      {aktif === "icra" && <IcraForm />}
      {aktif === "faiz" && <FaizForm />}
      {aktif === "harc" && <HarcForm />}
      {aktif === "iscilik" && <IscilikForm />}
      {aktif === "nafaka" && <NafakaForm />}
      {aktif === "kur" && <KurTablo kurlar={kurlar} tarih={kurTarih} bayat={kurBayat} />}
      {aktif === "donusturucu" && <Donusturucu />}
    </div>
  );
}
