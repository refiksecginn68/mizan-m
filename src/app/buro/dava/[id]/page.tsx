import { redirect, notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  User,
  Building2,
  Hash,
  Calendar,
  FileText,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aktif: { label: "Aktif", color: "bg-green-100 text-green-800" },
  kapatildi: { label: "Kapatıldı", color: "bg-gray-100 text-gray-600" },
  arsiv: { label: "Arşiv", color: "bg-yellow-100 text-yellow-800" },
};

export default async function DavaDetayPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/giris");

  const serviceSupabase = createServiceClient() as AnyClient;

  const { data: caseData } = await serviceSupabase
    .from("cases")
    .select(`*, clients (id, full_name, email, phone, tc_no, address)`)
    .eq("id", params.id)
    .eq("lawyer_id", user.id)
    .single();

  if (!caseData) notFound();

  const { data: documents } = await serviceSupabase
    .from("case_documents")
    .select("*")
    .eq("case_id", params.id)
    .eq("lawyer_id", user.id)
    .order("created_at", { ascending: false });

  const statusInfo = STATUS_MAP[caseData.status] || STATUS_MAP.aktif;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/buro/davalar"
            className="text-muted-foreground hover:text-primary transition-colors p-1.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-2xl font-bold text-primary leading-tight">
                {caseData.title}
              </h1>
              <span className={`px-3 py-1 rounded-full font-body text-xs font-medium flex-shrink-0 ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="font-body text-sm text-muted-foreground mt-0.5">
              Oluşturulma: {new Date(caseData.created_at).toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Case details card */}
            <div className="card">
              <h2 className="font-heading text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Dava Bilgileri
              </h2>
              <dl className="space-y-3">
                {caseData.case_number && (
                  <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="font-body text-xs text-muted-foreground">Dava No</dt>
                      <dd className="font-mono text-sm text-foreground">{caseData.case_number}</dd>
                    </div>
                  </div>
                )}
                {caseData.court && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="font-body text-xs text-muted-foreground">Mahkeme</dt>
                      <dd className="font-body text-sm text-foreground">{caseData.court}</dd>
                    </div>
                  </div>
                )}
                {caseData.opposing_party && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="font-body text-xs text-muted-foreground">Karşı Taraf</dt>
                      <dd className="font-body text-sm text-foreground">{caseData.opposing_party}</dd>
                    </div>
                  </div>
                )}
                {caseData.opened_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="font-body text-xs text-muted-foreground">Açılış Tarihi</dt>
                      <dd className="font-body text-sm text-foreground">
                        {new Date(caseData.opened_at).toLocaleDateString("tr-TR")}
                      </dd>
                    </div>
                  </div>
                )}
                {caseData.description && (
                  <div className="pt-3 border-t border-border">
                    <dt className="font-body text-xs text-muted-foreground mb-1">Açıklama</dt>
                    <dd className="font-body text-sm text-foreground whitespace-pre-line">
                      {caseData.description}
                    </dd>
                  </div>
                )}
                {caseData.notes && (
                  <div className="pt-3 border-t border-border">
                    <dt className="font-body text-xs text-muted-foreground mb-1">Notlar</dt>
                    <dd className="font-body text-sm text-foreground whitespace-pre-line">
                      {caseData.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Documents card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Belgeler
                </h2>
                <span className="font-body text-xs text-muted-foreground bg-primary/5 px-2.5 py-1 rounded-full">
                  {documents?.length ?? 0} belge
                </span>
              </div>

              {!documents || documents.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-body text-sm text-muted-foreground">
                    Bu davaya henüz belge eklenmedi.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: AnyClient) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-foreground truncate">{doc.name}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString("tr-TR")} ·{" "}
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Client card */}
            {caseData.clients && (
              <div className="card">
                <h2 className="font-heading text-base font-bold text-primary mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Müvekkil
                </h2>
                <div className="space-y-2">
                  <p className="font-body font-medium text-foreground">{caseData.clients.full_name}</p>
                  {caseData.clients.phone && (
                    <p className="font-body text-sm text-muted-foreground">{caseData.clients.phone}</p>
                  )}
                  {caseData.clients.email && (
                    <a
                      href={`mailto:${caseData.clients.email}`}
                      className="font-body text-sm text-primary hover:underline block"
                    >
                      {caseData.clients.email}
                    </a>
                  )}
                  {caseData.clients.tc_no && (
                    <p className="font-mono text-xs text-muted-foreground">
                      TC: {caseData.clients.tc_no}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* AI Assistant */}
            <div className="card bg-primary text-white">
              <h3 className="font-heading text-base font-bold mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                AI Dosya Asistanı
              </h3>
              <p className="font-body text-xs text-white/70 mb-3">
                Bu dava dosyası bağlamında içtihat araştırması yapın, strateji geliştirin.
              </p>
              <Link
                href={`/buro/asistan?case=${params.id}`}
                className="block w-full text-center bg-accent text-primary font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
              >
                Asistanı Aç
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
