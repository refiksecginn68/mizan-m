"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BuroError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/buro hata]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl">⚠️</span>
        </div>
        <h1 className="font-heading text-lg font-bold text-gray-900 mb-2">Büro sayfası yüklenemedi</h1>
        <p className="text-sm text-gray-500 mb-1">Teknik bir hata oluştu.</p>
        {error.message && (
          <p className="text-xs text-red-400 bg-red-50 rounded-lg px-3 py-2 mb-4 font-mono break-all">
            {error.message}
          </p>
        )}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl bg-[#1a2744] text-white text-sm font-semibold hover:bg-[#0f1729] transition-colors"
          >
            Tekrar Dene
          </button>
          <Link
            href="/giris"
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Çıkış Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
