"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0f1729] transition-colors group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      <span>Geri</span>
    </button>
  );
}
