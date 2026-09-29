"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type TurDurum = "tamamlandi" | "atlandi";

interface Ctx {
  yuklendi: boolean;
  durum: Record<string, TurDurum>;
  isaretle: (sayfa: string, durum: TurDurum) => void;
  sifirla: () => Promise<void>;
}

const OnboardingTourContext = createContext<Ctx | null>(null);

// Avukat panelindeki sayfa bazlı tanıtım turlarının durumunu bir kez yükler,
// tüm sayfalar bu context'ten okur (sayfa başına ayrı fetch yapılmaz).
export function OnboardingTourProvider({ children }: { children: React.ReactNode }) {
  const [durum, setDurum] = useState<Record<string, TurDurum>>({});
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding/tur")
      .then((r) => r.json())
      .then((data: { durum?: Record<string, TurDurum> }) => setDurum(data.durum ?? {}))
      .catch(() => {})
      .finally(() => setYuklendi(true));
  }, []);

  const isaretle = useCallback((sayfa: string, yeniDurum: TurDurum) => {
    setDurum((prev) => ({ ...prev, [sayfa]: yeniDurum }));
    fetch("/api/onboarding/tur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sayfa, durum: yeniDurum }),
    }).catch(() => {});
  }, []);

  const sifirla = useCallback(async () => {
    await fetch("/api/onboarding/tur/sifirla", { method: "POST" }).catch(() => {});
    setDurum({});
  }, []);

  return (
    <OnboardingTourContext.Provider value={{ yuklendi, durum, isaretle, sifirla }}>
      {children}
    </OnboardingTourContext.Provider>
  );
}

export function useOnboardingTourContext() {
  const ctx = useContext(OnboardingTourContext);
  if (!ctx) throw new Error("useOnboardingTourContext OnboardingTourProvider dışında kullanıldı");
  return ctx;
}
