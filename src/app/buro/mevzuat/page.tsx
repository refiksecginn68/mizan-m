import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Construction } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function MevzuatPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1a2744]/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-[#1a2744]/40" />
        </div>
        <h1 className="font-heading text-xl font-bold text-[#0f1729] mb-2">Mevzuat Arama</h1>
        <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
          <Construction className="w-4 h-4" />
          Yakında aktif olacak
        </p>
      </div>
    </div>
  );
}
