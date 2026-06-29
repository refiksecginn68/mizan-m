import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import VatandasHeader from "@/components/shared/VatandasHeader";
import Link from "next/link";
import { Scale, MessageSquare, Clock, ChevronRight, History, ArrowLeft } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AsistanGecmisPage() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/asistan/gecmis");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, credit_balance")
    .eq("id", user.id)
    .single() as { data: { full_name: string; user_type: string; credit_balance: number } | null };

  if (!profile) redirect("/giris");

  const serviceSupabase = createServiceClient() as Any;

  // Sessions + ilk/son mesaj önizleme
  const { data: sessions } = await serviceSupabase
    .from("sessions")
    .select(`
      id,
      title,
      created_at,
      messages (
        id,
        role,
        content,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-background">
      <VatandasHeader fullName={profile.full_name} creditBalance={profile.credit_balance} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/asistan" className="text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            <h1 className="font-heading text-2xl font-bold text-primary">Sohbet Geçmişi</h1>
          </div>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="card text-center py-16">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-heading text-lg font-bold text-primary mb-1">Henüz sohbet yok</p>
            <p className="font-body text-sm text-muted-foreground mb-4">
              AI Asistan ile ilk sohbetinizi başlatın.
            </p>
            <Link href="/asistan" className="btn-primary inline-flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Asistana Git
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(sessions as Any[]).map((session) => {
              const msgs = (session.messages ?? []) as Any[];
              const sorted = [...msgs].sort(
                (a: Any, b: Any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              const lastMsg = sorted[0];
              const msgCount = msgs.length;
              const preview = lastMsg?.content
                ? lastMsg.content.slice(0, 120) + (lastMsg.content.length > 120 ? "..." : "")
                : "—";

              return (
                <Link
                  key={session.id}
                  href={`/asistan?session=${session.id}`}
                  className="card flex items-start gap-4 hover:shadow-elevated hover:-translate-y-0.5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                    <MessageSquare className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-heading text-sm font-bold text-primary truncate">
                        {session.title || "Sohbet"}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(session.created_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {preview}
                    </p>
                    <p className="font-body text-[10px] text-muted-foreground mt-1.5">
                      {msgCount} mesaj
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
