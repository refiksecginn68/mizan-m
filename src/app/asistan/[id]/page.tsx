import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatWindow from "@/components/chat/ChatWindow";
import Link from "next/link";
import { Scale, ArrowLeft, History } from "lucide-react";
import type { LegalSource } from "@/types";

interface Props {
  params: { id: string };
}

interface MessageRow {
  id: string;
  role: string;
  content: string;
  sources: unknown;
  credit_cost: number | null;
}

interface SessionRow {
  id: string;
  title: string;
  user_id: string;
}

export default async function AsistanSessionPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/giris?redirect=/asistan/${params.id}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, credit_balance")
    .eq("id", user.id)
    .single() as { data: { user_type: string; credit_balance: number } | null };

  if (!profile) redirect("/giris");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, user_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single() as unknown as { data: SessionRow | null };

  if (!session) notFound();

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("id, role, content, sources, credit_cost")
    .eq("session_id", params.id)
    .order("created_at", { ascending: true }) as unknown as { data: MessageRow[] | null };

  const messages = (rawMessages ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    sources: m.sources as LegalSource[] | undefined,
    creditCost: m.credit_cost ?? undefined,
  }));

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-primary border-b border-primary-600 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/asistan" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent" />
              <span className="font-heading font-bold text-white truncate max-w-[200px]">
                {session.title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/asistan/gecmis" className="text-white/60 hover:text-white transition-colors">
              <History className="w-5 h-5" />
            </Link>
            <span className="font-body text-sm font-bold text-accent bg-accent/20 px-2.5 py-1 rounded-full">
              {profile.credit_balance} kredi
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden max-w-4xl w-full mx-auto">
        <ChatWindow
          userType={profile.user_type as "vatandas" | "avukat"}
          creditBalance={profile.credit_balance}
          sessionId={params.id}
          initialMessages={messages}
        />
      </div>
    </div>
  );
}
