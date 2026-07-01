"use client";
import { useEffect } from "react";

// Supabase trigger gecikmesi — 1 saniye bekle, /buro'ya yönlendir
export default function BuroYukleniyor() {
  useEffect(() => {
    const t = setTimeout(() => { window.location.href = "/buro"; }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Büro yükleniyor...</p>
      </div>
    </div>
  );
}
