"use client";

import { useRef, useState } from "react";
import { Upload, FileStack, Loader2, ArrowRight } from "lucide-react";

const BICIMLER = [
  { id: "pdf", ad: "PDF" },
  { id: "docx", ad: "Word (.docx)" },
  { id: "udf", ad: "UDF (UYAP)" },
] as const;

function uzanti(ad: string) { return ad.toLowerCase().split(".").pop() ?? ""; }

export default function Donusturucu() {
  const [dosya, setDosya] = useState<File | null>(null);
  const [hedef, setHedef] = useState<string>("docx");
  const [durum, setDurum] = useState<"bos" | "calisiyor" | "hata">("bos");
  const [mesaj, setMesaj] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const kaynak = dosya ? uzanti(dosya.name) : "";
  const hedefler = BICIMLER.filter((b) => b.id !== kaynak);

  async function donustur() {
    if (!dosya) return;
    if (kaynak === hedef) { setDurum("hata"); setMesaj("Kaynak ve hedef biçim aynı olamaz."); return; }
    setDurum("calisiyor"); setMesaj("");
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
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dosya.name.replace(/\.[^.]+$/, "")}.${hedef}`;
      a.click();
      URL.revokeObjectURL(url);
      setDurum("bos");
      setMesaj(uyari === "ocr" ? "İndirildi. Not: kaynak PDF'te metin katmanı yoktu, OCR ile okundu — çıktıyı kontrol edin." : "Dönüştürüldü ve indirildi.");
    } catch {
      setDurum("hata"); setMesaj("Ağ hatası — tekrar deneyin.");
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800">
        PDF ↔ Word ↔ UDF dönüşümü. Tüm işlem sunucuda yapılır. Taranmış (metin katmanı olmayan) PDF gelirse OCR denenir; okunamıyorsa Medya &amp; Delil &gt; OCR akışını kullanın.
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-[#c9a84c]/50 transition-colors"
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx,.udf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0] ?? null; setDosya(f); setMesaj(""); setDurum("bos");
            if (f) { const k = uzanti(f.name); setHedef(BICIMLER.find((b) => b.id !== k)!.id); } }} />
        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        {dosya ? (
          <p className="text-sm font-medium text-primary">{dosya.name} <span className="text-gray-400">({(dosya.size / 1024).toFixed(0)} KB)</span></p>
        ) : (
          <p className="text-sm text-gray-500">Dosya seçmek için tıklayın (.pdf, .docx, .udf · en çok 20MB)</p>
        )}
      </div>

      {dosya && (
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary uppercase px-3 py-2 rounded-lg bg-gray-100">
            <FileStack className="w-4 h-4" /> {kaynak || "?"}
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <select value={hedef} onChange={(e) => setHedef(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/40">
            {hedefler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
          </select>
          <button onClick={donustur} disabled={durum === "calisiyor"}
            className="inline-flex items-center gap-2 bg-[#0f1729] text-white font-semibold text-sm px-6 py-2 rounded-xl hover:bg-[#0f1729]/90 disabled:opacity-60">
            {durum === "calisiyor" ? <><Loader2 className="w-4 h-4 animate-spin" /> Dönüştürülüyor…</> : "Dönüştür"}
          </button>
        </div>
      )}

      {mesaj && (
        <p className={`mt-4 text-sm ${durum === "hata" ? "text-red-600" : "text-green-700"}`}>{mesaj}</p>
      )}
    </div>
  );
}
