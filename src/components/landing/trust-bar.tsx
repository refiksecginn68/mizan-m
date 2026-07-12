"use client";

import { motion } from "framer-motion";
import { ShieldCheck, LockKeyhole, EyeOff, MapPin } from "lucide-react";

interface TrustItem {
  icon: typeof ShieldCheck;
  label: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck, label: "KVKK Uyumlu" },
  { icon: LockKeyhole, label: "Uçtan Uca Şifreli" },
  { icon: EyeOff, label: "Veriler Model Eğitiminde Kullanılmaz" },
  { icon: MapPin, label: "Türkiye'de Barındırılıyor" },
];

// Güven bandı: altın ince çizgilerle ayrılmış yatay güvence listesi
export default function TrustBar() {
  return (
    <section aria-label="Güven ve uyumluluk" className="bg-navy-950 border-y border-navy-800">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-8">
        <motion.ul
          className="grid grid-cols-2 lg:grid-cols-4 gap-y-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {TRUST_ITEMS.map((item, i) => (
            <li
              key={item.label}
              className={`flex items-center justify-center gap-3 px-4 ${
                i > 0 ? "lg:border-l lg:border-gold-500/20" : ""
              }`}
            >
              <item.icon aria-hidden className="w-5 h-5 text-gold-500 flex-shrink-0" />
              <span className="font-inter text-xs md:text-sm text-cream/70 text-center sm:text-left">
                {item.label}
              </span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
