"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles, FileUp, BookOpen, Download, FileText,
  Loader2, Copy, Check, RefreshCw, Edit3,
  Clock, X, AlertCircle, Save, ChevronRight,
  FileCode2, Star, Trash2, MessageCircleQuestion, ArrowRight, ImageIcon,
} from "lucide-react";

import dynamic from "next/dynamic";
import { duzMetinHtml } from "@/lib/services/metin-html";
import MicButton from "@/components/ui/MicButton";

// TipTap tabanlı editör ağır (~100KB) — yalnızca belge üretilince yüklenir
const DilekceEditor = dynamic(() => import("@/components/dilekce/DilekceEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  ),
});
// Şablon korpusu ~190KB — sayfa bundle'ına gömülmez, sekme açılınca dinamik yüklenir
import type { DilekceSablonu } from "@/lib/data/dilekce-sablonlari";

type Tab = "ai" | "evrak" | "sablonar" | "ornekler";
type Asama = "form" | "sorular";

interface Sablon {
  id: string;
  title: string;
  document_type: string;
  content: string;
  created_at: string;
}

interface DosyaSonucu {
  ad: string;
  ok: boolean;
  text: string;
  kind?: string;
  chars?: number;
  ocr?: boolean;
  warning?: string;
  error?: string;
}

interface Soru {
  soru: string;
  ipucu?: string;
}

interface Props {
  lawyerName: string;
  sablonar: Sablon[];
  initialFavoriler?: string[];
  initialKonu?: string;
  initialTur?: string;
}

const MAX_DOSYA = 20;
const KABUL_EDILEN = ".pdf,.docx,.doc,.txt,.udf,.png,.jpg,.jpeg,.gif,.webp";
const MAX_TOPLAM_CHARS = 200_000;

// Okunan belgelerden AI'a giden birleşik metni üretir (extract API ile aynı format)
const birlesikMetin = (liste: DosyaSonucu[]) =>
  liste.filter((d) => d.ok && d.text)
    .map((d) => `\n\n===== BELGE: ${d.ad} =====\n${d.text}`)
    .join("").trim().slice(0, MAX_TOPLAM_CHARS);

export default function DilekceAvukatClient({
  lawyerName, sablonar: initialSablonar, initialFavoriler = [],
  initialKonu = "", initialTur = "",
}: Props) {
  const [tab, setTab] = useState<Tab>("ai");
  const [sablonar, setSablonar] = useState<Sablon[]>(initialSablonar);
  const [favoriler, setFavoriler] = useState<string[]>(initialFavoriler);

  // AI formu
  const [konu, setKonu] = useState(initialKonu);
  const [ekBilgi, setEkBilgi] = useState("");
  const [tur] = useState(initialTur);
  const [dosyalar, setDosyalar] = useState<DosyaSonucu[]>([]);
  const [dosyaMetni, setDosyaMetni] = useState("");
  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false);

  // Şablondan-üretim
  const [secilenSablonId, setSecilenSablonId] = useState<string>("");

  // Örnek şablon korpusu — dinamik chunk (bundle'ı şişirmesin)
  const [ornekSablonlar, setOrnekSablonlar] = useState<DilekceSablonu[]>([]);
  const [sablonKategorileri, setSablonKategorileri] = useState<readonly string[]>([]);
  const [sablonlarYuklendi, setSablonlarYuklendi] = useState(false);
  const secilenSablon = ornekSablonlar.find((s) => s.id === secilenSablonId);

  // Soru-sor akışı
  const [asama, setAsama] = useState<Asama>("form");
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [yanitlar, setYanitlar] = useState<string[]>([]);
  const [sohbet, setSohbet] = useState<{ soru: string; cevap: string }[]>([]);
  const [soruYukleniyor, setSoruYukleniyor] = useState(false);
  const [soruTuru, setSoruTuru] = useState({ tur: 1, maxTur: 3 });

  // Üretilen belge
  const [html, setHtml] = useState("");
  const [metin, setMetin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "word" | "udf" | null>(null);
  const [saved, setSaved] = useState(false);

  // Evrak sekmesi
  const [evrakMetin, setEvrakMetin] = useState("");
  const [evrakDosyalar, setEvrakDosyalar] = useState<DosyaSonucu[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const evrakRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firstName = lawyerName.split(" ")[0];

  const editorDegisti = useCallback((h: string, t: string) => {
    setHtml(h);
    setMetin(t);
  }, []);

  // ── Çoklu dosya yükleme (en fazla 20, birikimli) ────────────────
  // Yeni seçim öncekileri EZMEZ: aynı adlı dosya güncellenir, farklılar eklenir.
  // Böylece farklı türdeki belgeler (UDF+PDF+görsel...) tek tek veya toplu yüklenebilir.
  const dosyalariYukle = useCallback(async (
    secilen: FileList | File[],
    hedef: "ai" | "evrak",
  ) => {
    const mevcut = hedef === "ai" ? dosyalar : evrakDosyalar;
    const bosYer = MAX_DOSYA - mevcut.length;
    if (bosYer <= 0) {
      setError(`En fazla ${MAX_DOSYA} dosya yükleyebilirsiniz — önce listeden dosya çıkarın.`);
      return;
    }
    const liste = Array.from(secilen).slice(0, bosYer);
    if (!liste.length) return;
    if (secilen.length > bosYer) {
      setError(`En fazla ${MAX_DOSYA} dosya yükleyebilirsiniz — ilk ${bosYer} tanesi alındı.`);
    } else {
      setError("");
    }

    setDosyaYukleniyor(true);
    try {
      const form = new FormData();
      for (const f of liste) form.append("files", f);

      const res = await fetch("/api/buro/dilekce/extract", { method: "POST", body: form });
      const data = (await res.json()) as
        { files?: DosyaSonucu[]; text?: string; okunan?: number; toplam?: number; error?: string };

      if (!res.ok) { setError(data.error ?? "Belgeler okunamadı"); return; }

      const sonuclar = data.files ?? [];
      const yeniAdlar = new Set(sonuclar.map((s) => s.ad));
      const birlesik = [...mevcut.filter((d) => !yeniAdlar.has(d.ad)), ...sonuclar];
      if (hedef === "ai") {
        setDosyalar(birlesik);
        setDosyaMetni(birlesikMetin(birlesik));
      } else {
        setEvrakDosyalar(birlesik);
        setEvrakMetin(birlesikMetin(birlesik));
      }

      const hatali = sonuclar.filter((f) => !f.ok);
      const uyarili = sonuclar.filter((f) => f.warning);
      if (hatali.length) {
        setError(`${hatali.length} dosya okunamadı: ${hatali.map((f) => `${f.ad} (${f.error})`).join(", ")}`);
      } else if (uyarili.length) {
        setError(uyarili.map((f) => f.warning).join(" "));
      }
    } catch {
      setError("Belgeler yüklenemedi");
    } finally {
      setDosyaYukleniyor(false);
    }
  }, [dosyalar, evrakDosyalar]);

  function dosyaCikar(ad: string) {
    const kalan = dosyalar.filter((d) => d.ad !== ad);
    setDosyalar(kalan);
    setDosyaMetni(birlesikMetin(kalan));
  }

  // Sürükle-bırak: iki yükleme alanı da drop kabul eder ("Sürükle" vaadi gerçek olsun)
  function dropAl(e: React.DragEvent, hedef: "ai" | "evrak") {
    e.preventDefault();
    if (e.dataTransfer.files?.length) dosyalariYukle(e.dataTransfer.files, hedef);
  }

  // ── Soru-sor akışı ──────────────────────────────────────────────
  const sorulariGetir = useCallback(async (
    mevcutSohbet: { soru: string; cevap: string }[],
  ): Promise<boolean> => {
    setSoruYukleniyor(true);
    try {
      const res = await fetch("/api/buro/dilekce/sorular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konu, tur: tur || undefined, ekBilgi: ekBilgi || undefined,
          dosyaMetni: dosyaMetni || undefined,
          sablonBaslik: secilenSablon?.baslik,
          sohbet: mevcutSohbet,
        }),
      });
      const data = (await res.json()) as
        { hazir?: boolean; sorular?: Soru[]; tur?: number; maxTur?: number; error?: string };

      if (!res.ok) { setError(data.error ?? "Sorular alınamadı"); return true; }
      if (data.hazir || !data.sorular?.length) return true;

      setSorular(data.sorular);
      setYanitlar(new Array(data.sorular.length).fill(""));
      setSoruTuru({ tur: data.tur ?? 1, maxTur: data.maxTur ?? 3 });
      setAsama("sorular");
      return false;
    } catch {
      // Soru akışı çökerse üretimi engelleme
      return true;
    } finally {
      setSoruYukleniyor(false);
    }
  }, [konu, tur, ekBilgi, dosyaMetni, secilenSablon]);

  async function baslat() {
    if (!konu.trim()) return;
    setError("");
    setSohbet([]);
    const hazir = await sorulariGetir([]);
    if (hazir) generate("ai", []);
  }

  async function yanitlariGonder() {
    const yeni = [
      ...sohbet,
      ...sorular.map((s, i) => ({ soru: s.soru, cevap: yanitlar[i]?.trim() || "Bilgi verilmedi" })),
    ];
    setSohbet(yeni);
    setSorular([]);
    const hazir = await sorulariGetir(yeni);
    if (hazir) { setAsama("form"); generate("ai", yeni); }
  }

  function sorulariAtla() {
    setAsama("form");
    setSorular([]);
    generate("ai", sohbet);
  }

  // ── Üretim ──────────────────────────────────────────────────────
  async function generate(
    mod: "ai" | "duzenle" = "ai",
    mevcutSohbet: { soru: string; cevap: string }[] = sohbet,
  ) {
    if (!konu.trim() && mod === "ai") return;
    if (mod === "duzenle" && !metin) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError("");
    setAsama("form");
    if (mod === "ai") { setHtml(""); setMetin(""); }

    try {
      const res = await fetch("/api/buro/dilekce/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konu: konu || "Düzenle",
          tur: tur || undefined,
          ekBilgi: ekBilgi || undefined,
          dosyaMetni: dosyaMetni || undefined,
          sablonId: secilenSablonId || undefined,
          sohbet: mevcutSohbet.length ? mevcutSohbet : undefined,
          mod,
          mevcutMetin: mod === "duzenle" ? metin : undefined,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Hata oluştu");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buf = "";
      let biriken = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6)) as
              { delta?: string; done?: boolean; metin?: string; error?: string };
            if (json.error) { setError(json.error); break; }
            if (json.delta) {
              biriken += json.delta;
              setMetin(biriken);
              setHtml(duzMetinHtml(biriken));
            }
            // Akış sonunda sunucu temizlenmiş tam metni gönderir
            if (json.done && json.metin) {
              setMetin(json.metin);
              setHtml(duzMetinHtml(json.metin));
            }
          } catch { /* yarım parça — sonraki turda tamamlanır */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  // MizanAI'dan gelen konu varsa otomatik başlat
  useEffect(() => {
    if (initialKonu && !metin) baslat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Şablon korpusunu ayrı chunk olarak, sekmeye girildiğinde yükle
  useEffect(() => {
    if (sablonlarYuklendi) return;
    if (tab !== "ornekler" && !secilenSablonId) return;
    import("@/lib/data/dilekce-sablonlari").then((m) => {
      setOrnekSablonlar(m.DILEKCE_SABLONLARI);
      setSablonKategorileri(m.SABLON_KATEGORILERI);
      setSablonlarYuklendi(true);
    }).catch(() => {});
  }, [tab, secilenSablonId, sablonlarYuklendi]);

  async function generateFromEvrak() {
    if (!evrakMetin) return;
    setKonu("Yüklenen belgeleri inceleyerek uygun dilekçeye dönüştür");
    setDosyaMetni(evrakMetin);
    setTab("ai");
    setSohbet([]);
    generate("ai", []);
  }

  function copyText() {
    navigator.clipboard.writeText(metin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Dışa aktarma ────────────────────────────────────────────────
  async function disaAktar(format: "pdf" | "word" | "udf") {
    setExporting(format);
    setError("");
    try {
      const res = await fetch(`/api/buro/dilekce/export-${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, metin, baslik: konu.trim().split("\n")[0] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? `${format.toUpperCase()} indirilemedi`);
        return;
      }
      const blob = await res.blob();
      if (!blob.size) { setError(`${format.toUpperCase()} dosyası boş üretildi`); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dilekce.${format === "word" ? "docx" : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(`${format.toUpperCase()} indirilemedi — bağlantı hatası`);
    } finally {
      setExporting(null);
    }
  }

  async function saveAsTemplate() {
    if (!metin || !konu) return;
    try {
      const res = await fetch("/api/buro/sablon/kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: konu.trim().split("\n")[0].slice(0, 120), content: metin, document_type: "avukat_sablon" }),
      });
      const data = await res.json() as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok) { setError(data.error ?? "Şablon kaydedilemedi"); return; }
      setSaved(true);
      setSablonar((prev) => [
        { id: data.id ?? Date.now().toString(), title: konu.slice(0, 120), document_type: "avukat_sablon", content: metin, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setTimeout(() => setSaved(false), 2500);
    } catch { setError("Şablon kaydedilemedi"); }
  }

  async function deleteSablon(id: string) {
    const onceki = sablonar;
    setSablonar((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/buro/sablon/kaydet?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) setSablonar(onceki);
    } catch { setSablonar(onceki); }
  }

  function loadSablon(s: Sablon) {
    setMetin(s.content);
    setHtml(duzMetinHtml(s.content));
    setKonu(s.title);
    setTab("ai");
  }

  async function toggleFavori(sablonId: string) {
    const favoriMi = favoriler.includes(sablonId);
    setFavoriler((prev) => (favoriMi ? prev.filter((f) => f !== sablonId) : [...prev, sablonId]));
    try {
      const res = favoriMi
        ? await fetch(`/api/buro/dilekce/favori?sablon_id=${encodeURIComponent(sablonId)}`, { method: "DELETE" })
        : await fetch("/api/buro/dilekce/favori", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sablon_id: sablonId }),
          });
      if (!res.ok) setFavoriler((prev) => (favoriMi ? [...prev, sablonId] : prev.filter((f) => f !== sablonId)));
    } catch {
      setFavoriler((prev) => (favoriMi ? [...prev, sablonId] : prev.filter((f) => f !== sablonId)));
    }
  }

  // ── Örnek şablonlar sekmesi ─────────────────────────────────────
  const [ornekArama, setOrnekArama] = useState("");
  const [ornekKategori, setOrnekKategori] = useState("");
  const [ornekIndiriliyor, setOrnekIndiriliyor] = useState("");
  const [sadeceFavoriler, setSadeceFavoriler] = useState(false);

  const filtreliOrnekler = ornekSablonlar.filter((s) => {
    if (sadeceFavoriler && !favoriler.includes(s.id)) return false;
    if (ornekKategori && s.kategori !== ornekKategori) return false;
    if (ornekArama.trim()) {
      const q = ornekArama.toLowerCase();
      return `${s.baslik} ${s.kategori} ${s.aciklama} ${s.davaTuru} ${s.yetkiliMahkeme}`.toLowerCase().includes(q);
    }
    return true;
  });

  function ornekEditordeAc(s: DilekceSablonu) {
    setMetin(s.icerik);
    setHtml(duzMetinHtml(s.icerik));
    setKonu(s.baslik);
    setSecilenSablonId("");
    setTab("ai");
  }

  // Şablondan-üretim: şablonu iskelet seç, konuyu yaz, AI uyarlasın
  function sablondanUret(s: DilekceSablonu) {
    setSecilenSablonId(s.id);
    setKonu("");
    setHtml(""); setMetin("");
    setSohbet([]); setAsama("form");
    setTab("ai");
  }

  async function ornekIndir(s: DilekceSablonu, format: "pdf" | "word" | "udf") {
    setOrnekIndiriliyor(`${s.id}-${format}`);
    try {
      const res = await fetch(`/api/buro/dilekce/export-${format}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: duzMetinHtml(s.icerik), baslik: s.baslik }),
      });
      if (!res.ok) { setError(`${s.baslik} indirilemedi`); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${s.id}.${format === "word" ? "docx" : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { setError("İndirme başarısız"); }
    finally { setOrnekIndiriliyor(""); }
  }

  const gorselMi = (k?: string) => k === "gorsel";

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0f1729]">Dilekçe İşlemleri</h1>
            <p className="text-sm text-gray-400 mt-0.5">Av. {firstName} · AI destekli belge hazırlama</p>
          </div>
          <div className="flex items-center gap-1">
            {(["ai", "evrak", "ornekler", "sablonar"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  tab === t ? "bg-[#0f1729] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {t === "ai" && "AI ile Oluştur"}
                {t === "evrak" && "Evrak Yükle & Düzenle"}
                {t === "ornekler" && `Örnek Şablonlar${sablonlarYuklendi ? ` (${ornekSablonlar.length})` : ""}`}
                {t === "sablonar" && `Şablonlarım (${sablonar.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* AI SEKMESİ */}
        {tab === "ai" && (
          <>
            {/* Sol: Form */}
            <div className="w-96 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
              <div className="m-4 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">AI Destekli</span>
                  {tur && <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">{tur}</span>}
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-heading text-base font-bold text-white">MizanAI ile Dilekçe Oluştur</p>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Olayı anlatın; MizanAI önce eksikleri sorar, sonra emsal ve mevzuatla desteklenmiş dilekçeyi hazırlar.
                </p>
              </div>

              <div className="px-4 pb-4 space-y-4 flex-1">
                {/* Seçili şablon rozeti */}
                {secilenSablon && (
                  <div className="flex items-start gap-2 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-xl px-3 py-2.5">
                    <BookOpen className="w-4 h-4 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-[#c9a84c] uppercase">Temel alınan şablon</p>
                      <p className="text-xs font-semibold text-gray-700 truncate">{secilenSablon.baslik}</p>
                      <p className="text-[10px] text-gray-400">{secilenSablon.yetkiliMahkeme}</p>
                    </div>
                    <button onClick={() => setSecilenSablonId("")} title="Şablonu kaldır"
                      className="text-gray-400 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
                    <span>Olayı Anlatın <span className="text-red-400">*</span></span>
                    <MicButton onTranscript={(t) => setKonu((p) => p + t)} title="Olayı sesle anlatın"
                      className="w-7 h-7" />
                  </label>
                  <textarea
                    value={konu}
                    onChange={(e) => setKonu(e.target.value)}
                    placeholder="Örn: Müvekkilim 5 yıllık iş ilişkisinin ardından haksız yere feshedildi, kıdem tazminatı talep ediyoruz..."
                    rows={5}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#7c3aed] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Bahsetme / Not <span className="text-gray-300">(isteğe bağlı)</span>
                  </label>
                  <textarea
                    value={ekBilgi}
                    onChange={(e) => setEkBilgi(e.target.value)}
                    placeholder="AI'a talimat: örn. 'faiz talebini vurgula', 'kısa tut'..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#7c3aed] resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Bu alan AI&apos;a yön verir; yazdıklarınız dilekçe metnine eklenmez.
                  </p>
                </div>

                {/* Çoklu dosya */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Ek Dosyalar <span className="text-gray-300">(en fazla {MAX_DOSYA})</span>
                  </label>
                  <div onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => dropAl(e, "ai")}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      dosyalar.length ? "border-[#7c3aed]/40 bg-[#7c3aed]/5" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <input ref={fileRef} type="file" className="hidden" multiple accept={KABUL_EDILEN}
                      onChange={(e) => {
                        if (e.target.files) dosyalariYukle(e.target.files, "ai");
                        e.target.value = ""; // aynı dosya tekrar seçilebilsin (change tetiklenmezdi)
                      }} />
                    {dosyaYukleniyor ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-[#7c3aed]">
                        <Loader2 className="w-4 h-4 animate-spin" /> Belgeler okunuyor...
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">Dosya Seç veya Sürükle</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">UDF, PDF, Word, ekran görüntüsü</p>
                      </>
                    )}
                  </div>

                  {dosyalar.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dosyalar.map((d) => (
                        <div key={d.ad}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${
                            d.ok ? "bg-gray-50" : "bg-red-50"
                          }`}>
                          {gorselMi(d.kind)
                            ? <ImageIcon className="w-3.5 h-3.5 text-[#7c3aed] flex-shrink-0" />
                            : <FileText className="w-3.5 h-3.5 text-[#7c3aed] flex-shrink-0" />}
                          <span className="flex-1 truncate font-medium text-gray-600">{d.ad}</span>
                          {d.ocr && <span className="text-[9px] font-bold text-[#c9a84c] bg-[#c9a84c]/10 px-1.5 rounded">OCR</span>}
                          {d.ok
                            ? <span className="text-gray-400">{d.chars} krk</span>
                            : <span className="text-red-500">hata</span>}
                          <button onClick={() => dosyaCikar(d.ad)} className="text-gray-300 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <p className="text-[10px] text-gray-400 pt-0.5">
                        {dosyalar.filter((d) => d.ok && d.text).length}/{dosyalar.length} belge okundu
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  onClick={baslat}
                  disabled={loading || soruYukleniyor || !konu.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {soruYukleniyor
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Konu inceleniyor...</>
                    : loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                      : <><Sparkles className="w-4 h-4" /> Dilekçe Oluşturmaya Başla</>}
                </button>

                {loading && (
                  <button onClick={() => abortRef.current?.abort()}
                    className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1">
                    Durdur
                  </button>
                )}
              </div>
            </div>

            {/* Sağ: Sorular veya Editör */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#f4f5f7]">
              {asama === "sorular" ? (
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center">
                        <MessageCircleQuestion className="w-5 h-5 text-[#7c3aed]" />
                      </div>
                      <div>
                        <h2 className="font-heading text-base font-bold text-[#0f1729]">Birkaç soru</h2>
                        <p className="text-xs text-gray-400">
                          Tur {soruTuru.tur}/{soruTuru.maxTur} · Dilekçeyi somutlaştırmak için
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3 mb-6 leading-relaxed">
                      Dilekçeyi yazmadan önce eksik gördüğüm noktaları netleştirmek istiyorum.
                      Bilmiyorsanız boş bırakabilirsiniz — o kısımlar yer tutucu olarak kalır.
                    </p>

                    <div className="space-y-5">
                      {sorular.map((s, i) => (
                        <div key={i}>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{s.soru}</label>
                          {s.ipucu && <p className="text-[11px] text-gray-400 mb-1.5">{s.ipucu}</p>}
                          <textarea
                            value={yanitlar[i] ?? ""}
                            onChange={(e) => setYanitlar((p) => p.map((v, j) => (j === i ? e.target.value : v)))}
                            rows={2}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none focus:border-[#7c3aed] resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-7">
                      <button onClick={yanitlariGonder} disabled={soruYukleniyor}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#0f1729] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1a2744] transition-colors disabled:opacity-40">
                        {soruYukleniyor
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Değerlendiriliyor...</>
                          : <>Devam <ArrowRight className="w-4 h-4" /></>}
                      </button>
                      <button onClick={sorulariAtla} disabled={soruYukleniyor}
                        className="text-xs font-semibold text-gray-400 hover:text-[#7c3aed] px-4 py-2.5 transition-colors">
                        Soruları atla, doğrudan üret
                      </button>
                    </div>

                    {sohbet.length > 0 && (
                      <div className="mt-7 pt-5 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Önceki yanıtlar</p>
                        <div className="space-y-2">
                          {sohbet.map((s, i) => (
                            <div key={i} className="text-[11px]">
                              <p className="text-gray-500 font-medium">{s.soru}</p>
                              <p className="text-gray-400 pl-2">→ {s.cevap}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : !html && !loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/10 flex items-center justify-center mx-auto mb-4">
                      <Edit3 className="w-8 h-8 text-[#7c3aed]/40" />
                    </div>
                    <p className="font-heading text-base font-bold text-[#0f1729] mb-1">Editör</p>
                    <p className="text-sm text-gray-400">Dilekçeyi oluşturduktan sonra burada düzenleyebilirsiniz</p>
                  </div>
                </div>
              ) : loading && !html ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#7c3aed] animate-spin mx-auto mb-3" />
                    <p className="font-heading text-base font-bold text-[#0f1729]">Dilekçe hazırlanıyor...</p>
                    <p className="text-sm text-gray-400 mt-1">Emsal ve mevzuat taranıyor</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Eylem çubuğu */}
                  <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    <button onClick={copyText}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
                      {copied ? <><Check className="w-3 h-3 text-green-500" /> Kopyalandı</> : <><Copy className="w-3 h-3" /> Kopyala</>}
                    </button>
                    <button onClick={() => generate("duzenle")} disabled={loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors disabled:opacity-40">
                      <RefreshCw className="w-3 h-3" /> Yeniden Üret
                    </button>
                    <button onClick={saveAsTemplate} disabled={!metin || saved}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-40">
                      {saved ? <><Check className="w-3 h-3 text-green-500" /> Kaydedildi</> : <><Save className="w-3 h-3" /> Şablon Kaydet</>}
                    </button>

                    <div className="flex-1" />

                    <button onClick={() => disaAktar("pdf")} disabled={!!exporting || loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                      {exporting === "pdf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
                    </button>
                    <button onClick={() => disaAktar("word")} disabled={!!exporting || loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40">
                      {exporting === "word" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} Word
                    </button>
                    <button onClick={() => disaAktar("udf")} disabled={!!exporting || loading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors disabled:opacity-40">
                      {exporting === "udf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileCode2 className="w-3 h-3" />} UDF (UYAP)
                    </button>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <DilekceEditor html={html} onChange={editorDegisti} duzenlenebilir={!loading} />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* EVRAK SEKMESİ */}
        {tab === "evrak" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-100 p-8">
                <h2 className="font-heading text-lg font-bold text-[#0f1729] mb-2">Evrak Yükle & Düzenle</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Belge, sözleşme, dava dosyası veya ekran görüntüsü yükleyin (en fazla {MAX_DOSYA}) —
                  AI hepsini okuyup uygun dilekçeyi hazırlasın.
                </p>

                <div onClick={() => evrakRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => dropAl(e, "evrak")}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    evrakDosyalar.length ? "border-[#7c3aed]/40 bg-[#7c3aed]/5" : "border-gray-200 hover:border-[#7c3aed]/30"
                  }`}>
                  <input ref={evrakRef} type="file" className="hidden" multiple accept={KABUL_EDILEN}
                    onChange={(e) => {
                      if (e.target.files) dosyalariYukle(e.target.files, "evrak");
                      e.target.value = ""; // aynı dosya tekrar seçilebilsin
                    }} />
                  {dosyaYukleniyor ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-[#7c3aed]">
                      <Loader2 className="w-5 h-5 animate-spin" /> Belgeler okunuyor...
                    </div>
                  ) : (
                    <>
                      <FileUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500">Dosya Seç veya Sürükle</p>
                      <p className="text-xs text-gray-300 mt-1">UDF, PDF, DOC, DOCX, TXT, PNG, JPG — dosya başına max 15MB</p>
                    </>
                  )}
                </div>

                {evrakDosyalar.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {evrakDosyalar.map((d) => (
                      <div key={d.ad} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${d.ok ? "bg-gray-50" : "bg-red-50"}`}>
                        {gorselMi(d.kind) ? <ImageIcon className="w-3.5 h-3.5 text-[#7c3aed]" /> : <FileText className="w-3.5 h-3.5 text-[#7c3aed]" />}
                        <span className="flex-1 truncate font-medium text-gray-600">{d.ad}</span>
                        {d.ocr && <span className="text-[9px] font-bold text-[#c9a84c] bg-[#c9a84c]/10 px-1.5 rounded">OCR</span>}
                        <span className={d.ok ? "text-gray-400" : "text-red-500"}>{d.ok ? `${d.chars} krk` : d.error}</span>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                {evrakMetin && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-500 mb-2">
                      Belgelerden çıkarılan metin ({evrakMetin.length} karakter)
                    </label>
                    <textarea value={evrakMetin} onChange={(e) => setEvrakMetin(e.target.value)} rows={8}
                      className="w-full text-xs text-gray-600 border border-gray-200 rounded-xl px-3 py-3 focus:outline-none resize-none font-mono" />
                  </div>
                )}

                <button onClick={generateFromEvrak} disabled={!evrakMetin || loading}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> İşleniyor...</> : <><ChevronRight className="w-4 h-4" /> Dilekçeye Dönüştür</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ŞABLONLARIM */}
        {tab === "sablonar" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              {sablonar.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="font-heading text-base font-bold text-[#0f1729] mb-1">Henüz şablon yok</p>
                  <p className="text-sm text-gray-400">Oluşturduğunuz dilekçeleri &quot;Şablon Kaydet&quot; ile buraya ekleyin</p>
                  <button onClick={() => setTab("ai")} className="mt-4 text-sm text-[#7c3aed] hover:underline font-semibold">
                    İlk dilekçeyi oluştur →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sablonar.map((s) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-sm font-bold text-[#0f1729] truncate">{s.title}</h3>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(s.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{s.content.slice(0, 180)}...</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => loadSablon(s)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors">
                            <Edit3 className="w-3.5 h-3.5" /> Düzenle
                          </button>
                          <button onClick={() => deleteSablon(s.id)} title="Şablonu sil"
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ÖRNEK ŞABLONLAR */}
        {tab === "ornekler" && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="mb-5">
                <h2 className="font-heading text-lg font-bold text-[#0f1729]">Örnek Dilekçe Şablonları</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Özgün olarak hazırlanmış, [köşeli parantezli] yer tutucular içeren standart iskeletler.
                  &quot;Bu şablonla üret&quot; ile AI şablonun yapısını konunuza uyarlar.
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                <input value={ornekArama} onChange={(e) => setOrnekArama(e.target.value)}
                  placeholder="Şablon ara... (ör. kıdem, boşanma, tahliye, itiraz)"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#c9a84c]" />
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSadeceFavoriler(!sadeceFavoriler)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sadeceFavoriler ? "bg-[#c9a84c] text-white" : "bg-[#c9a84c]/10 text-[#c9a84c] hover:bg-[#c9a84c]/20"
                    }`}>
                    <Star className={`w-3 h-3 ${sadeceFavoriler ? "fill-white" : "fill-[#c9a84c]"}`} />
                    Favoriler ({favoriler.length})
                  </button>
                  <button onClick={() => setOrnekKategori("")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      ornekKategori === "" ? "bg-[#0f1729] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>
                    Tümü ({ornekSablonlar.length})
                  </button>
                  {sablonKategorileri.map((k) => {
                    const n = ornekSablonlar.filter((s) => s.kategori === k).length;
                    if (!n) return null;
                    return (
                      <button key={k} onClick={() => setOrnekKategori(ornekKategori === k ? "" : k)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          ornekKategori === k ? "bg-[#0f1729] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>
                        {k} ({n})
                      </button>
                    );
                  })}
                </div>
              </div>

              {!sablonlarYuklendi ? (
                <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Şablonlar yükleniyor...</span>
                </div>
              ) : filtreliOrnekler.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Aramanızla eşleşen şablon bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtreliOrnekler.map((s) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-[#c9a84c] bg-[#c9a84c]/10 px-2 py-0.5 rounded-full">{s.kategori}</span>
                            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{s.yetkiliMahkeme}</span>
                            <button onClick={() => toggleFavori(s.id)}
                              title={favoriler.includes(s.id) ? "Favoriden çıkar" : "Favoriye ekle"}
                              className="text-gray-300 hover:text-[#c9a84c] transition-colors">
                              <Star className={`w-4 h-4 ${favoriler.includes(s.id) ? "fill-[#c9a84c] text-[#c9a84c]" : ""}`} />
                            </button>
                          </div>
                          <p className="font-heading text-sm font-bold text-[#0f1729]">{s.baslik}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.aciklama}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{s.dilekceTipi} · {s.davaTuru}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <button onClick={() => sablondanUret(s)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] text-white hover:opacity-90 transition-opacity">
                            <Sparkles className="w-3.5 h-3.5" /> Bu şablonla üret
                          </button>
                          <button onClick={() => ornekEditordeAc(s)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#0f1729] text-white hover:bg-[#1a2744] transition-colors">
                            <Edit3 className="w-3.5 h-3.5" /> Editörde Aç
                          </button>
                          <div className="flex items-center gap-1">
                            {(["pdf", "word", "udf"] as const).map((f) => (
                              <button key={f} onClick={() => ornekIndir(s, f)}
                                disabled={ornekIndiriliyor === `${s.id}-${f}`}
                                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors disabled:opacity-50">
                                {ornekIndiriliyor === `${s.id}-${f}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                {f.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
