import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Calculator } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// FAZ 3 teslimatı — sekmeler şimdilik "Yakında" olarak pasif.
const ARAC_SEKMELERI = [
  "İcra Kapak",
  "Faiz",
  "Harç & Vekalet",
  "İşçilik",
  "Nafaka",
  "Kur & Piyasa",
  "Dönüştürücü",
];

export default async function HesaplamaPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* Pasif sekme çubuğu — dar ekranda kaydırılabilir, taşma yapmaz */}
      <div className="bg-[#f4f5f7] border-b border-gray-200/60 px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {ARAC_SEKMELERI.map((ad) => (
            <span
              key={ad}
              aria-disabled
              className="whitespace-nowrap px-3.5 py-2.5 text-sm font-medium text-gray-400 border-b-2 border-transparent cursor-not-allowed flex items-center gap-1.5"
            >
              {ad}
              <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-semibold">
                Yakında
              </span>
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0f1729] flex items-center justify-center mx-auto mb-5">
          <Calculator className="w-7 h-7 text-[#c9a84c]" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary">Hesaplama & Dönüştürücü</h1>
        <p className="font-body text-muted-foreground mt-2 max-w-md mx-auto">
          İcra kapak hesabı, faiz, harç & vekalet, işçilik, nafaka hesaplayıcıları ile
          güncel kur takibi ve PDF ↔ Word ↔ UDF dönüştürücü çok yakında bu bölümde.
        </p>
      </main>
    </div>
  );
}
