"use client";

import { useEffect, useState } from "react";
// Selamlama KULLANICININ yerel saatine göre hesaplanmalı — sunucu (Vercel) UTC
// çalıştığı için server component'te hesaplamak gece "Günaydın" yazdırıyordu.
import { selamla } from "@/lib/selamlama";

export default function Selamlama({ firstName }: { firstName: string }) {
  // İlk render iki tarafta da null → hydration uyuşmazlığı olmaz
  const [selam, setSelam] = useState<string | null>(null);

  useEffect(() => {
    const guncelle = () => setSelam(selamla(new Date().getHours()));
    guncelle();
    const iv = setInterval(guncelle, 60000);
    return () => clearInterval(iv);
  }, []);

  return (
    <h1 className="font-heading text-xl font-bold text-[#0f1729]">
      {selam ?? "Hoş geldiniz"}, Av. {firstName} 👋
    </h1>
  );
}
