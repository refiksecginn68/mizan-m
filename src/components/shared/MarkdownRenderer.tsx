"use client";

// AI çıktı görüntüleyici — merkezi katmanın istemci ayağı.
// AI çıktıları düz metindir; eski kayıtlı mesajlarda kalan markdown sembolleri
// de render öncesi aiCiktiTemizle ile deterministik olarak temizlenir.
// (Ad geriye dönük uyumluluk için MarkdownRenderer kaldı — tüm AI yüzeyleri bunu kullanır.)

import { useMemo } from "react";
import { aiCiktiTemizle } from "@/lib/ai/ai-cikti";

interface Props {
  content: string;
  className?: string;
  /* Koyu zemin üzerinde açık renk metin için */
  invert?: boolean;
}

// BÜYÜK HARF başlık satırı: en az 3 harf, tamamı büyük (Türkçe dahil), sonu ":" olabilir
function baslikMi(satir: string): boolean {
  const s = satir.trim();
  if (s.length < 3 || s.length > 80) return false;
  const harfler = s.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, "");
  if (harfler.length < 3) return false;
  return harfler === harfler.toLocaleUpperCase("tr-TR");
}

export default function MarkdownRenderer({ content, className = "", invert = false }: Props) {
  const temiz = useMemo(() => aiCiktiTemizle(content), [content]);
  const bodyColor = invert ? "text-white/90" : "text-gray-800";
  const headColor = invert ? "text-white" : "text-[#0f1729]";

  return (
    <div className={`max-w-none ${className}`}>
      {temiz.split("\n").map((satir, i) =>
        baslikMi(satir) ? (
          <p key={i} className={`text-sm font-bold leading-relaxed mt-2 ${headColor}`}>{satir}</p>
        ) : (
          <p key={i} className={`text-sm leading-relaxed whitespace-pre-wrap min-h-[0.5em] ${bodyColor}`}>{satir}</p>
        )
      )}
    </div>
  );
}
