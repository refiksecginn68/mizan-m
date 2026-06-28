import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatWindow from "@/components/chat/ChatWindow";
import Link from "next/link";
import { Scale, ArrowLeft, History } from "lucide-react";

export default async function AsistanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/asistan");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, credit_balance")
    .eq("id", user.id)
    .single() as { data: { full_name: string; user_type: string; credit_balance: number } | null };

  if (!profile) redirect("/giris");

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-primary border-b border-primary-600 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent" />
              <span className="font-heading font-bold text-white">AI Asistan</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/asistan/gecmis"
              className="text-white/60 hover:text-white transition-colors"
              title="Geçmiş sohbetler"
            >
              <History className="w-5 h-5" />
            </Link>
            <span className="font-body text-sm font-bold text-accent bg-accent/20 px-2.5 py-1 rounded-full">
              {profile.credit_balance} kredi
            </span>
          </div>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-4xl w-full mx-auto">
        <ChatWindow
          userType={profile.user_type as "vatandas" | "avukat"}
          creditBalance={profile.credit_balance}
          placeholder="Hukuki sorunuzu yazın... (örn: kiracım kira ödemiyor)"
        />
      </div>
    </div>
  );
}
