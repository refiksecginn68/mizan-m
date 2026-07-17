"use client";

// Eşzamanlı oturum bekçisi: periyodik kalp atışıyla bu cihazın hâlâ aktif
// olup olmadığını sorar. Başka cihazdan yapılan yeni giriş bu cihazı
// düşürdüyse kullanıcıyı bilgilendirip giriş sayfasına yönlendirir.

import { useEffect, useRef } from "react";

const ARALIK_MS = 45_000;

export default function OturumBekci() {
  const kontrolEdiliyor = useRef(false);

  useEffect(() => {
    let durduruldu = false;

    async function kontrol() {
      if (kontrolEdiliyor.current || durduruldu) return;
      kontrolEdiliyor.current = true;
      try {
        const res = await fetch("/api/oturum", { method: "POST" });
        if (res.ok) {
          const data = (await res.json()) as { aktif?: boolean };
          if (data.aktif === false && !durduruldu) {
            window.location.href = "/giris?neden=oturum-dusuruldu";
            return;
          }
        }
      } catch { /* ağ hatası — sonraki turda tekrar dener */ }
      kontrolEdiliyor.current = false;
    }

    kontrol();
    const id = setInterval(kontrol, ARALIK_MS);
    const odaklaninca = () => { if (document.visibilityState === "visible") kontrol(); };
    document.addEventListener("visibilitychange", odaklaninca);

    return () => {
      durduruldu = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", odaklaninca);
    };
  }, []);

  return null;
}
