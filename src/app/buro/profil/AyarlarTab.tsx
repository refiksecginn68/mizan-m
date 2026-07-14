"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sun, Moon, Monitor, Type, ZoomIn, Bell, Globe2, KeyRound,
  LogOut, Download, Trash2, Loader2, CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Tema = "light" | "dark" | "system";

function temayiUygula(tema: Tema) {
  const koyu = tema === "dark" || (tema === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", koyu);
}

function Bolum({ baslik, ikon: Ikon, children }: { baslik: string; ikon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6">
      <h2 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
        <Ikon className="w-4 h-4 text-accent" /> {baslik}
      </h2>
      {children}
    </div>
  );
}

export default function AyarlarTab({ emailBildirim }: { emailBildirim: boolean }) {
  const router = useRouter();
  const [tema, setTema] = useState<Tema>("light");
  const [font, setFont] = useState("normal");
  const [zoom, setZoom] = useState(100);
  const [bildirim, setBildirim] = useState(emailBildirim);
  const [bildirimKayit, setBildirimKayit] = useState(false);

  const [yeniSifre, setYeniSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [sifreDurum, setSifreDurum] = useState<{ tip: "ok" | "hata"; mesaj: string } | null>(null);
  const [sifreKayit, setSifreKayit] = useState(false);

  const [silOnay, setSilOnay] = useState("");
  const [silDurum, setSilDurum] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    setTema((localStorage.getItem("mizanim-tema") as Tema) ?? "light");
    setFont(localStorage.getItem("mizanim-font") ?? "normal");
    setZoom(Math.round(parseFloat(localStorage.getItem("mizanim-zoom") ?? "1") * 100));
  }, []);

  function temaDegistir(t: Tema) {
    setTema(t);
    localStorage.setItem("mizanim-tema", t);
    temayiUygula(t);
  }

  function fontDegistir(f: string) {
    setFont(f);
    localStorage.setItem("mizanim-font", f);
    if (f === "normal") document.documentElement.removeAttribute("data-font");
    else document.documentElement.setAttribute("data-font", f);
  }

  function zoomDegistir(z: number) {
    setZoom(z);
    localStorage.setItem("mizanim-zoom", String(z / 100));
    document.documentElement.style.setProperty("--app-zoom", String(z / 100));
  }

  async function bildirimDegistir(acik: boolean) {
    setBildirim(acik);
    setBildirimKayit(true);
    const res = await fetch("/api/ayarlar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_notifications: acik }),
    });
    if (!res.ok) setBildirim(!acik);
    setBildirimKayit(false);
  }

  async function sifreDegistir() {
    setSifreDurum(null);
    if (yeniSifre.length < 6) {
      setSifreDurum({ tip: "hata", mesaj: "Şifre en az 6 karakter olmalıdır." });
      return;
    }
    if (yeniSifre !== sifreTekrar) {
      setSifreDurum({ tip: "hata", mesaj: "Şifreler eşleşmiyor." });
      return;
    }
    setSifreKayit(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: yeniSifre });
    setSifreKayit(false);
    if (error) {
      setSifreDurum({ tip: "hata", mesaj: "Şifre güncellenemedi. Lütfen tekrar deneyin." });
    } else {
      setSifreDurum({ tip: "ok", mesaj: "Şifreniz güncellendi." });
      setYeniSifre("");
      setSifreTekrar("");
    }
  }

  async function oturumlariKapat() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/giris");
  }

  async function hesabiSil() {
    setSilDurum(null);
    setSiliniyor(true);
    try {
      const res = await fetch("/api/hesap/sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onay: silOnay }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSilDurum(data.error ?? "Hesap silinemedi.");
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setSilDurum("Bağlantı hatası.");
    } finally {
      setSiliniyor(false);
    }
  }

  const secimStili = (aktif: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 font-body text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
      aktif ? "border-accent bg-accent/10 text-primary" : "border-border text-muted-foreground hover:text-primary"
    }`;

  return (
    <div className="space-y-6">
      <Bolum baslik="Görünüm" ikon={Sun}>
        <p className="font-body text-xs text-muted-foreground mb-2">Tema</p>
        <div className="flex gap-2 mb-5">
          <button type="button" onClick={() => temaDegistir("light")} className={secimStili(tema === "light")}>
            <Sun className="w-3.5 h-3.5" /> Açık
          </button>
          <button type="button" onClick={() => temaDegistir("dark")} className={secimStili(tema === "dark")}>
            <Moon className="w-3.5 h-3.5" /> Koyu
          </button>
          <button type="button" onClick={() => temaDegistir("system")} className={secimStili(tema === "system")}>
            <Monitor className="w-3.5 h-3.5" /> Sistem
          </button>
        </div>

        <p className="font-body text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> Yazı Boyutu
        </p>
        <div className="flex gap-2 mb-5">
          <button type="button" onClick={() => fontDegistir("kucuk")} className={secimStili(font === "kucuk")}>Küçük</button>
          <button type="button" onClick={() => fontDegistir("normal")} className={secimStili(font === "normal")}>Normal</button>
          <button type="button" onClick={() => fontDegistir("buyuk")} className={secimStili(font === "buyuk")}>Büyük</button>
        </div>

        <p className="font-body text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <ZoomIn className="w-3.5 h-3.5" /> Yakınlaştırma: <span className="font-bold text-primary">%{zoom}</span>
        </p>
        <input
          type="range"
          min={80}
          max={125}
          step={5}
          value={zoom}
          onChange={(e) => zoomDegistir(Number(e.target.value))}
          className="w-full accent-[#c9a84c]"
          aria-label="Yakınlaştırma"
        />
      </Bolum>

      <Bolum baslik="Bildirimler" ikon={Bell}>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="font-body text-sm text-primary">
            E-posta bildirimleri
            <span className="block font-body text-xs text-muted-foreground mt-0.5">
              Ödeme onayları ve hatırlatmalar e-posta ile gönderilsin
            </span>
          </span>
          <span className="flex items-center gap-2">
            {bildirimKayit && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            <input
              type="checkbox"
              checked={bildirim}
              onChange={(e) => bildirimDegistir(e.target.checked)}
              className="w-5 h-5 accent-[#c9a84c]"
            />
          </span>
        </label>
      </Bolum>

      <Bolum baslik="Dil" ikon={Globe2}>
        <select
          value="tr"
          disabled
          className="w-full sm:w-64 border border-border rounded-xl px-4 py-2.5 font-body text-sm bg-[#f8f9fa] text-primary"
          aria-label="Dil"
        >
          <option value="tr">Türkçe</option>
          <option value="en">English — yakında</option>
        </select>
      </Bolum>

      <Bolum baslik="Güvenlik" ikon={KeyRound}>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            type="password"
            value={yeniSifre}
            onChange={(e) => setYeniSifre(e.target.value)}
            placeholder="Yeni şifre"
            autoComplete="new-password"
            className="border border-border rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <input
            type="password"
            value={sifreTekrar}
            onChange={(e) => setSifreTekrar(e.target.value)}
            placeholder="Yeni şifre (tekrar)"
            autoComplete="new-password"
            className="border border-border rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        {sifreDurum && (
          <p className={`font-body text-xs mb-3 flex items-center gap-1.5 ${sifreDurum.tip === "ok" ? "text-green-700" : "text-danger"}`}>
            {sifreDurum.tip === "ok" && <CheckCircle className="w-3.5 h-3.5" />}
            {sifreDurum.mesaj}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={sifreDegistir} disabled={sifreKayit} className="btn-primary px-6 py-2 text-sm">
            {sifreKayit ? "Kaydediliyor..." : "Şifreyi Değiştir"}
          </button>
          <button
            type="button"
            onClick={oturumlariKapat}
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-danger border border-danger/30 rounded-xl px-5 py-2 hover:bg-danger/5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Tüm Oturumları Sonlandır
          </button>
        </div>
      </Bolum>

      <Bolum baslik="Hesap (KVKK)" ikon={Trash2}>
        <a
          href="/api/hesap/veri"
          download
          className="inline-flex items-center gap-2 font-body text-sm font-semibold text-primary border border-border rounded-xl px-5 py-2 hover:bg-[#f8f9fa] transition-colors mb-5"
        >
          <Download className="w-4 h-4" /> Verilerimi İndir (JSON)
        </a>
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <p className="font-body text-sm font-semibold text-red-800 mb-1">Hesabı Kalıcı Olarak Sil</p>
          <p className="font-body text-xs text-red-700 leading-relaxed mb-3">
            Tüm verileriniz (profil, davalar, ödeme geçmişi) geri alınamaz şekilde silinir.
            Onaylamak için aşağıya <strong>HESABIMI SİL</strong> yazın.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={silOnay}
              onChange={(e) => setSilOnay(e.target.value)}
              placeholder="HESABIMI SİL"
              className="border border-red-300 rounded-xl px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <button
              type="button"
              onClick={hesabiSil}
              disabled={silOnay !== "HESABIMI SİL" || siliniyor}
              className="inline-flex items-center gap-2 font-body text-sm font-bold text-white bg-red-600 rounded-xl px-5 py-2 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {siliniyor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Hesabı Sil
            </button>
          </div>
          {silDurum && <p className="font-body text-xs text-danger mt-2">{silDurum}</p>}
        </div>
      </Bolum>
    </div>
  );
}
