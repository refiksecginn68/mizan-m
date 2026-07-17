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
  BookOpen,
  ExternalLink,
} from "lucide-react";
import DavaBelgeler from "@/components/buro/DavaBelgeler";
import DavaAsistanPanel from "@/components/buro/DavaAsistanPanel";

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

  // Emsal/mevzuat referansları ile gerçek dosyaları ayır
  const allDocs = (documents ?? []) as AnyClient[];
  const kararRefs = allDocs.filter((d) => d.file_type === "emsal_karar" || d.file_type === "mevzuat");
  const fileDocs = allDocs.filter((d) => d.file_type !== "emsal_karar" && d.file_type !== "mevzuat");

  const statusInfo = STATUS_MAP[caseData.status] || STATUS_MAP.aktif;

  // Bu dava/müvekkile ait finans kayıtları — asistan bağlamına girer
  const { data: allPayments } = await serviceSupabase
    .from("payments")
    .select("description, amount, status, metadata, created_at")
    .eq("user_id", user.id)
    .limit(200);

  const davaOdemeleri = ((allPayments ?? []) as AnyClient[]).filter(
    (p) => p.metadata?.case_id === params.id || (caseData.clients?.id && p.metadata?.client_id === caseData.clients.id)
  );

  const fmtTL = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);
  const finansSatirlari: string[] = [];
  if (davaOdemeleri.length > 0) {
    let tahsil = 0;
    let bekleyen = 0;
    for (const p of davaOdemeleri) {
      const yon = p.metadata?.direction === "gider" ? "Gider" : "Gelir";
      const durum = p.status === "success" ? "ÖDENDİ" : p.status === "pending" ? "BEKLİYOR" : p.status;
      const vade = p.metadata?.due_date
        ? ` | Vade: ${new Date(p.metadata.due_date).toLocaleDateString("tr-TR")}`
        : "";
      if (p.metadata?.direction !== "gider") {
        if (p.status === "success") tahsil += p.amount;
        if (p.status === "pending") bekleyen += p.amount;
      }
      finansSatirlari.push(`• [${yon}/${durum}] ${p.description ?? "Ödeme"}: ${fmtTL(p.amount)}${vade}`);
    }
    finansSatirlari.push(`Toplam tahsil edilen: ${fmtTL(tahsil)} | Bekleyen tahsilat: ${fmtTL(bekleyen)}`);
  }

  // Yan bar asistan için dava bağlamı
  const caseContext = [
    `Dava: ${caseData.title}`,
    caseData.case_number ? `Dava No: ${caseData.case_number}` : "",
    caseData.court ? `Mahkeme: ${caseData.court}` : "",
    caseData.clients?.full_name || caseData.client_name
      ? `Müvekkil: ${caseData.clients?.full_name ?? caseData.client_name}`
      : "",
    caseData.opposing_party ? `Karşı Taraf: ${caseData.opposing_party}` : "",
    caseData.description ? `Açıklama: ${caseData.description}` : "",
    caseData.notes ? `Notlar: ${caseData.notes}` : "",
    fileDocs.length > 0 ? `Belgeler: ${fileDocs.map((d) => d.name).join(", ")}` : "",
    kararRefs.length > 0 ? `Bağdaştırılan kararlar: ${kararRefs.map((d) => d.name).join("; ")}` : "",
    finansSatirlari.length > 0
      ? `Ödeme/Taksit Durumu (müvekkilin finans kayıtları):\n${finansSatirlari.join("\n")}`
      : "Ödeme/Taksit Durumu: bu dosya için kayıtlı ödeme yok.",
  ].filter(Boolean).join("\n");

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

            {/* Bağdaştırılan Kararlar / Mevzuat */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold text-primary flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Bağdaştırılan Kararlar / Mevzuat
                </h2>
                <span className="font-body text-xs text-muted-foreground bg-primary/5 px-2.5 py-1 rounded-full">
                  {kararRefs.length} kayıt
                </span>
              </div>
              {kararRefs.length === 0 ? (
                <div className="text-center py-6 border border-border rounded-xl">
                  <BookOpen className="w-7 h-7 text-muted-foreground mx-auto mb-1.5" />
                  <p className="font-body text-sm text-muted-foreground">
                    Henüz karar veya mevzuat bağdaştırılmadı. Karar Arama sayfasından &quot;Dosyaya Ekle&quot; ile ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {kararRefs.map((ref: AnyClient) => {
                    const meta = (ref.ai_risks ?? {}) as Record<string, string | null>;
                    const kararId = meta.karar_id ?? ref.ai_summary?.match(/Karar ID: (\S+)/)?.[1];
                    return (
                      <div key={ref.id} className="p-3 rounded-lg bg-primary/5">
                        <div className="flex items-start gap-3">
                          <Scale className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm font-medium text-foreground">{ref.name}</p>
                            {ref.ai_summary && (
                              <p className="font-body text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {ref.ai_summary.split("\n")[0]}
                              </p>
                            )}
                            <p className="font-body text-xs text-muted-foreground mt-1">
                              {meta.decision_date && `Karar tarihi: ${meta.decision_date} · `}
                              Eklendi: {new Date(ref.created_at).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                          {kararId && (
                            <a
                              href={`/buro/emsal/${encodeURIComponent(kararId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border text-primary hover:border-accent hover:text-accent transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Yeni Sekmede Aç
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Documents card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Belgeler
                </h2>
                <span className="font-body text-xs text-muted-foreground bg-primary/5 px-2.5 py-1 rounded-full">
                  {fileDocs.length} belge
                </span>
              </div>
              <DavaBelgeler
                caseId={params.id}
                initialDocuments={fileDocs.map((d: AnyClient) => ({
                  id: d.id,
                  name: d.name,
                  file_type: d.file_type,
                  file_size: d.file_size,
                  created_at: d.created_at,
                }))}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Client card — kayıtlı müvekkil yoksa manuel isim gösterilir */}
            {!caseData.clients && caseData.client_name && (
              <div className="card">
                <h2 className="font-heading text-base font-bold text-primary mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Müvekkil
                </h2>
                <p className="font-body font-medium text-foreground">{caseData.client_name}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">Manuel kayıt — müvekkil kartı yok</p>
              </div>
            )}
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
              <DavaAsistanPanel
                caseId={params.id}
                caseTitle={caseData.title}
                caseContext={caseContext}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
