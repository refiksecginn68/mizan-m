"use client";

import { useState } from "react";
import { User, Wallet, Settings } from "lucide-react";

const SEKMELER = [
  { id: "profil", ad: "Profil", ikon: User },
  { id: "odemeler", ad: "Ödemeler", ikon: Wallet },
  { id: "ayarlar", ad: "Ayarlar", ikon: Settings },
] as const;

type SekmeId = (typeof SEKMELER)[number]["id"];

interface Props {
  varsayilan?: SekmeId;
  profil: React.ReactNode;
  odemeler: React.ReactNode;
  ayarlar: React.ReactNode;
}

export default function ProfilTabs({ varsayilan = "profil", profil, odemeler, ayarlar }: Props) {
  const [aktif, setAktif] = useState<SekmeId>(varsayilan);

  return (
    <div>
      <div className="flex gap-1 bg-white border border-border rounded-xl p-1 mb-6" role="tablist">
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={aktif === s.id}
            onClick={() => setAktif(s.id)}
            className={`flex-1 flex items-center justify-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors ${
              aktif === s.id
                ? "bg-[#0f1729] text-white"
                : "text-gray-500 hover:text-[#0f1729]"
            }`}
          >
            <s.ikon className="w-4 h-4" />
            {s.ad}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {aktif === "profil" && profil}
        {aktif === "odemeler" && odemeler}
        {aktif === "ayarlar" && ayarlar}
      </div>
    </div>
  );
}
