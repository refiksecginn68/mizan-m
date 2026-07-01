"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Scale, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading text-2xl font-bold text-primary">Mizanım</span>
      </Link>

      <div className="text-center">
        <p className="font-heading text-8xl font-bold text-danger/10 mb-4 select-none">!</p>
        <h1 className="font-heading text-2xl font-bold text-primary mb-2">Bir Hata Oluştu</h1>
        <p className="font-body text-muted-foreground mb-8 max-w-sm">
          Beklenmedik bir sorun yaşandı. Ekibimiz bilgilendirildi.
          {error.digest && (
            <span className="block text-xs text-muted-foreground/60 mt-1">
              Hata kodu: {error.digest}
            </span>
          )}
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-lg font-body font-semibold text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-border px-5 py-2.5 rounded-lg font-body text-sm text-foreground hover:bg-muted transition-colors"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
