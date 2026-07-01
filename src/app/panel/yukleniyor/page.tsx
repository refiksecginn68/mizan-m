"use client";
import { useEffect } from "react";

export default function PanelYukleniyor() {
  useEffect(() => {
    const t = setTimeout(() => { window.location.href = "/panel"; }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-sm text-muted-foreground">Panel yükleniyor...</p>
      </div>
    </div>
  );
}
