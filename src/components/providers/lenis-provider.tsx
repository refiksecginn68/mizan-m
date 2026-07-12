"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

interface LenisProviderProps {
  children: ReactNode;
}

// Yumuşak kaydırma sağlayıcısı — yalnızca public (site) sayfalarında kullanılır.
// prefers-reduced-motion tercihinde devre dışı kalır.
export default function LenisProvider({ children }: LenisProviderProps) {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
