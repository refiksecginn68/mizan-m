"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BuroContentHeader() {
  const pathname = usePathname();
  const router = useRouter();
  // Ana büro sayfasında geri butonu gösterme
  if (pathname === "/buro") return null;

  return (
    <div className="sticky top-0 z-10 bg-[#f4f5f7]/90 backdrop-blur-sm border-b border-gray-200/60 px-6 py-2.5">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0f1729] transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Geri</span>
      </button>
    </div>
  );
}
