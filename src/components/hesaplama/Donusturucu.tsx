"use client";

import { useRef, useState } from "react";
import { Upload, FileStack, Loader2, ArrowRight, ArrowLeftRight, Download, FileCheck2 } from "lucide-react";

const BICIMLER = [
  { id: "pdf", ad: "PDF" },
  { id: "docx", ad: "Word (.docx)" },
  { id: "udf", ad: "UDF (UYAP)" },
] as const;

function uzanti(ad: string) { return ad.toLowerCase().split(".").pop() ?? ""; }
function bicimAd(id: string) { return BICIMLER.find((b) => b.id === id)?.ad ?? id.toUpperCase(); }

export default function Donusturucu() {
  const [dosya, setDosya] = useState<File | null>(null);
  const [kaynak, setKaynak] = useState<string>("pdf");
  const [hedef, setHedef] = useState<string>("docx");
  const [durum, setDurum] = useState<"bos" | "calisiyor" | "hata">("bos");
  const [mesaj, setMesaj] = useState<string>("");
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [cikti, setCikti] = useState<{ url: string; ad: string; boyut: number; not?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function dosyaAl(f: File | null) {
    setDosya(f); setMesaj(""); setDurum("bos"); setCikti(null);
    if (f) {
      const k = uzanti(f.name);
      setKaynak(k);
      setHedef((h) => (h === k ? (BICIMLER.find((b) => b.id !== k)!.id) : h));
    }
  }

  function yonDegistir() {
    setKaynak(hedef); setHedef(kaynak);
  }

  async function donustur() {
    if (!dosya) return;
    if (kaynak === hedef) { setDurum("hata"); setMesaj("Kaynak ve hedef biçim aynı olamaz."); return; }
    setDurum("calisiyor"); setMesaj(""); setCikti(null);
    try {
      const fd = new FormData();
      fd.append("dosya", dosya);
      fd.append("hedef", hedef);
      const res = await fetch("/api/hesaplama/donustur", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setDurum("hata"); setMesaj(j.error ?? "Dönüştürme başarısız."); return;
      }
      const uyari = res.headers.get("X-Kaynak-Uyari");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const ad = `${dosya.name.replace(/\.[^.]+$/, "")}.${hedef}`;
      setCikti({ url, ad, boyut: blob.size, not: uyari === "ocr" ? "Kaynak PDF'te metin katmanı yoktu, OCR ile okundu — çıktıyı kontrol edin." : undefined });
      setDurum("bos");
    } catch {
      setDurum("hata"); setMesaj("Ağ hatası — tekrar deneyin.");
    }
  }

  return (
    <div>
      <div className="mb-5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800">
        PDF ↔ Word ↔ UDF dönüşümü. Tüm işlem sunucuda yapılır. Taranmış (metin katmanı olmayan) PDF gelirse OCR denenir; okunamıyorsa Medya &amp; Delil &gt; OCR akışını kullanın.
      </div>

      <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-5 items-stretch">
        {/* SOL — YÜKLEME */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
          onDragLeave={() => setSurukleniyor(false)}
          onDrop={(e) => { e.preventDefault(); setSurukleniyor(false); dosyaAl(e.dataTransfer.files?.[0] ?? null); }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[180px] ${surukleniyor ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-border hover:border-[#c9a84c]/50"}`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx,.udf" className="hidden"
            onChange={(e) => dosyaAl(e.target.files?.[0] ?? null)} />
          <Upload className="w-8 h-8 text-gray-300 mb-2" />
          {dosya ? (
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-primary break-all">{dosya.name}</p>
              <p className="text-xs text-gray-400">{(dosya.size / 1024).toFixed(0)} KB · algılanan tür: {kaynak.toUpperCase() || "?"}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sürükleyip bırakın veya seçmek için tıklayın<br /><span className="text-xs text-gray-400">.pdf, .docx, .udf · en çok 20MB</span></p>
          )}
        </div>

        {/* ORTA — FORMAT SEÇİMİ */}
        <div className="flex lg:flex-col items-center justify-center gap-3 px-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary px-3 py-2 rounded-lg bg-gray-100 min-w-[120px] justify-center">
            <FileStack className="w-4 h-4" /> {bicimAd(kaynak)}
          </span>
          <button type="button" onClick={yonDegistir} title="Yön değiştir"
            className="p-2 rounded-lg border border-border text-gray-500 hover:text-[#0f1729] hover:border-[#c9a84c]/60 transition-colors">
            <ArrowLeftRight className="w-4 h-4 hidden lg:block" />
            <ArrowRight className="w-4 h-4 lg:hidden" />
          </button>
          <select value={hedef} onChange={(e) => setHedef(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/40 min-w-[120px]">
            {BICIMLER.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
          </select>
          <button onClick={donustur} disabled={durum === "calisiyor" || !dosya}
            className="inline-flex items-center gap-2 bg-[#0f1729] text-white font-semibold text-sm px-5 py-2 rounded-xl hover:bg-[#0f1729]/90 disabled:opacity-50 mt-1">
            {durum === "calisiyor" ? <><Loader2 className="w-4 h-4 animate-spin" /> Dönüştürülüyor…</> : "Dönüştür"}
          </button>
        </div>

        {/* SAĞ — ÇIKTI */}
        <div className="rounded-2xl border border-border bg-gray-50/60 p-6 flex flex-col items-center justify-center text-center min-h-[180px]">
          {cikti ? (
            <div className="space-y-3">
              <FileCheck2 className="w-9 h-9 text-green-600 mx-auto" />
              <div>
                <p className="text-sm font-medium text-primary break-all">{cikti.ad}</p>
                <p className="text-xs text-gray-400">{(cikti.boyut / 1024).toFixed(0)} KB</p>
              </div>
              <a href={cikti.url} download={cikti.ad}
                className="inline-flex items-center gap-2 bg-[#c9a84c] text-[#0f1729] font-semibold text-sm px-5 py-2 rounded-xl hover:bg-[#c9a84c]/90">
                <Download className="w-4 h-4" /> İndir
              </a>
              {cikti.not && <p className="text-[11px] text-amber-700 leading-snug">{cikti.not}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Dönüştürülen dosya burada görünecek.</p>
          )}
        </div>
      </div>

      {mesaj && durum === "hata" && (
        <p className="mt-4 text-sm text-red-600">{mesaj}</p>
      )}
    </div>
  );
}
