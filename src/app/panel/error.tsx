"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/panel hata]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-danger text-xl">⚠️</span>
        </div>
        <h1 className="font-heading text-lg font-bold text-primary mb-2">Panel yüklenemedi</h1>
        <p className="font-body text-sm text-muted-foreground mb-1">Teknik bir hata oluştu.</p>
        {error.message && (
          <p className="font-mono text-xs text-danger bg-danger/10 rounded-lg px-3 py-2 mb-4 break-all">
            {error.message}
          </p>
        )}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={reset}
            className="btn-primary w-full"
          >
            Tekrar Dene
          </button>
          <Link href="/giris" className="btn-outline w-full text-center">
            Çıkış Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
