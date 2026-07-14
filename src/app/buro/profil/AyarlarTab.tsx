/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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

export default function AyarlarTab({
  emailBildirim,
  pushEnabledInit,
  notifyTasksInit,
  notifyPaymentsInit,
  notifyTebligatInit,
}: {
  emailBildirim: boolean;
  pushEnabledInit: boolean;
  notifyTasksInit: boolean;
  notifyPaymentsInit: boolean;
  notifyTebligatInit: boolean;
}) {
  const router = useRouter();
  const [tema, setTema] = useState<Tema>("light");
  const [font, setFont] = useState("normal");
  const [zoom, setZoom] = useState(100);
  const [bildirim, setBildirim] = useState(emailBildirim);
  const [pushEnabled, setPushEnabled] = useState(pushEnabledInit);
  const [notifyTasks, setNotifyTasks] = useState(notifyTasksInit);
  const [notifyPayments, setNotifyPayments] = useState(notifyPaymentsInit);
  const [notifyTebligat, setNotifyTebligat] = useState(notifyTebligatInit);

  // PWA ve Cihaz durumları
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermissionState, setPushPermissionState] = useState<NotificationPermission>("default");

  const [testPushLoading, setTestPushLoading] = useState(false);
  const [testPushResult, setTestPushResult] = useState<{ tip: "ok" | "hata"; mesaj: string } | null>(null);

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

    // PWA & Push desteği tespiti
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    setIsStandalone(!!standalone);

    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setPushSupported(supported);

    if (supported) {
      setPushPermissionState(Notification.permission);
    }
  }, []);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function handlePushToggle(active: boolean) {
    setBildirimKayit(true);
    try {
      const resDb = await fetch("/api/ayarlar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ push_enabled: active }),
      });
      if (!resDb.ok) throw new Error("DB güncellenemedi");
      
      setPushEnabled(active);

      if (active) {
        const permission = await Notification.requestPermission();
        setPushPermissionState(permission);

        if (permission !== "granted") {
          alert("Bildirim izni verilmedi. Tarayıcı ayarlarından izni etkinleştirmeniz gerekir.");
          await fetch("/api/ayarlar", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ push_enabled: false }),
          });
          setPushEnabled(false);
          setBildirimKayit(false);
          return;
        }

        const keyRes = await fetch("/api/ayarlar/vapid-key");
        if (!keyRes.ok) throw new Error("VAPID anahtarı alınamadı");
        const { publicKey } = await keyRes.json();

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        const subRes = await fetch("/api/ayarlar/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });

        if (!subRes.ok) throw new Error("Abonelik kaydedilemedi");

      } else {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await fetch("/api/ayarlar/push-unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
      }
    } catch (err) {
      console.error("Push toggle error:", err);
      alert("Push bildirim işlemi sırasında bir hata oluştu.");
      setPushEnabled(!active);
    } finally {
      setBildirimKayit(false);
    }
  }

  async function handlePrefChange(key: "notify_tasks" | "notify_payments" | "notify_tebligat", val: boolean) {
    setBildirimKayit(true);
    try {
      const res = await fetch("/api/ayarlar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: val }),
      });
      if (res.ok) {
        if (key === "notify_tasks") setNotifyTasks(val);
        if (key === "notify_payments") setNotifyPayments(val);
        if (key === "notify_tebligat") setNotifyTebligat(val);
      } else {
        alert("Tercih kaydedilemedi.");
      }
    } catch {
      alert("Ağ hatası.");
    } finally {
      setBildirimKayit(false);
    }
  }

  async function sendTestPush() {
    setTestPushLoading(true);
    setTestPushResult(null);
    try {
      const res = await fetch("/api/ayarlar/test-push", { method: "POST" });
      if (res.ok) {
        setTestPushResult({ tip: "ok", mesaj: "Test bildirimi gönderildi! Cihazınızı kontrol edin." });
      } else {
        setTestPushResult({ tip: "hata", mesaj: "Test bildirimi gönderilemedi." });
      }
    } catch {
      setTestPushResult({ tip: "hata", mesaj: "Bağlantı hatası." });
    } finally {
      setTestPushLoading(false);
    }
  }

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
        <div className="space-y-4">
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

          {!pushSupported ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-muted-foreground">
              Tarayıcınız veya cihazınız anlık (Push) bildirimleri desteklemiyor.
            </div>
          ) : isIOS && !isStandalone ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-700 leading-relaxed">
              <strong className="block mb-1 text-amber-800">iOS / Safari Bildirim Ayarı:</strong>
              iOS cihazlarda bildirim alabilmek için bu web sitesini ana ekranınıza eklemelisiniz. 
              Safari&apos;de <strong className="text-amber-800 font-bold">Paylaş</strong> → <strong className="text-amber-800 font-bold">Ana Ekrana Ekle</strong> adımlarını takip edin ve uygulamayı oradan açıp buraya tekrar gelin.
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-body text-sm text-primary">
                  Cihaz bildirimleri (Web Push)
                  <span className="block font-body text-xs text-muted-foreground mt-0.5">
                    Bu tarayıcıya özel push bildirimlerini etkinleştirin
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => handlePushToggle(e.target.checked)}
                  className="w-5 h-5 accent-[#c9a84c]"
                />
              </label>

              {pushEnabled && (
                <div className="pl-6 space-y-3 mt-4 border-l-2 border-accent/20">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-body text-xs text-primary">
                      Görev & Duruşma Hatırlatıcıları
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        Takvim etkinliklerine 1 saat ve 1 gün kala push bildirimi gider
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={notifyTasks}
                      onChange={(e) => handlePrefChange("notify_tasks", e.target.checked)}
                      className="w-4 h-4 accent-[#c9a84c]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-body text-xs text-primary">
                      Finans & Ödeme Hatırlatıcıları
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        Yaklaşan ödeme ve taksitlere 2 gün kala bildirim gider
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={notifyPayments}
                      onChange={(e) => handlePrefChange("notify_payments", e.target.checked)}
                      className="w-4 h-4 accent-[#c9a84c]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-body text-xs text-primary">
                      Yeni Tebligat Bildirimleri
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        UETS sisteminden yeni tebligat okunduğunda anında uyarır
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={notifyTebligat}
                      onChange={(e) => handlePrefChange("notify_tebligat", e.target.checked)}
                      className="w-4 h-4 accent-[#c9a84c]"
                    />
                  </label>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={sendTestPush}
                      disabled={testPushLoading}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/30 rounded-xl px-3 py-1.5 hover:bg-accent/5 transition-colors disabled:opacity-50"
                    >
                      {testPushLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                      Test Bildirimi Gönder
                    </button>
                    {testPushResult && (
                      <p className={`font-body text-[11px] mt-1.5 ${testPushResult.tip === "ok" ? "text-green-700" : "text-red-600"}`}>
                        {testPushResult.mesaj}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
