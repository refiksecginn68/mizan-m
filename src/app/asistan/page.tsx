import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import ChatWindow from "@/components/chat/ChatWindow";
import Link from "next/link";
import { Scale, ArrowLeft, History } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface PageProps {
  searchParams: { session?: string };
}

export default async function AsistanPage({ searchParams }: PageProps) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/asistan");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, credit_balance")
    .eq("id", user.id)
    .single() as { data: { full_name: string; user_type: string; credit_balance: number } | null };

  if (!profile) redirect("/giris");

  // Önceki session'dan mesajları yükle
  let initialMessages: { id: string; role: "user" | "assistant"; content: string }[] = [];
  let sessionTitle: string | undefined;
  const sessionId = searchParams.session;

  if (sessionId) {
    const serviceSupabase = createServiceClient() as Any;
    const { data: msgs } = await serviceSupabase
      .from("messages")
      .select("id, role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(100);

    const { data: sessionRow } = await serviceSupabase
      .from("sessions")
      .select("title, user_id")
      .eq("id", sessionId)
      .single();

    // Güvenlik: sadece kendi session'ı
    if (sessionRow?.user_id === user.id) {
      initialMessages = (msgs ?? []).map((m: Any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      sessionTitle = sessionRow?.title;
    }
  }

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
              <div>
                <span className="font-heading font-bold text-white">AI Asistan</span>
                {sessionTitle && (
                  <p className="text-white/50 text-[10px] leading-none mt-0.5 truncate max-w-[200px]">{sessionTitle}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sessionId && (
              <Link
                href="/asistan"
                className="text-xs text-white/60 hover:text-white border border-white/20 rounded-lg px-2.5 py-1 transition-colors"
              >
                Yeni Sohbet
              </Link>
            )}
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
          sessionId={sessionId}
          initialMessages={initialMessages}
          placeholder="Hukuki sorunuzu yazın... (örn: kiracım kira ödemiyor)"
        />
      </div>
    </div>
  );
}
