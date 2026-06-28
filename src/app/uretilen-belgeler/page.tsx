import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VatandasHeader from "@/components/shared/VatandasHeader";
import { FileText, Calendar, Download, Plus } from "lucide-react";
import Link from "next/link";

interface GeneratedDocument {
  id: string;
  title: string;
  document_type: string;
  created_at: string;
  file_path: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  ihtarname: "İhtarname",
  sikayet_dilekce: "Şikayet Dilekçesi",
  itiraz_dilekce: "İtiraz Dilekçesi",
  is_tazminat: "İş Tazminatı",
  kira_tahliye: "Kira/Tahliye",
  tuketici_sikayet: "Tüketici Şikayeti",
  nafaka: "Nafaka Talebi",
  vekaletname_talep: "Belge Talebi",
  dilekce: "Dilekçe",
};

export default async function UretilenBelgelerPage() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyClient = supabase as any;
  const { data: { user } } = await anyClient.auth.getUser();

  if (!user) redirect("/giris");

  const { data: profile } = await anyClient
    .from("profiles")
    .select("full_name, user_type, credit_balance")
    .eq("id", user.id)
    .single() as { data: { full_name: string; user_type: string; credit_balance: number } | null };

  if (!profile || profile.user_type !== "vatandas") redirect("/buro");

  const { data: documents } = await anyClient
    .from("generated_documents")
    .select("id, title, document_type, created_at, file_path")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50) as { data: GeneratedDocument[] | null };

  return (
    <div className="min-h-screen bg-background">
      <VatandasHeader fullName={profile.full_name} creditBalance={profile.credit_balance} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Dilekçelerim</h1>
            <p className="font-body text-muted-foreground mt-1">
              AI ile ürettiğiniz dilekçe ve belgeler.
            </p>
          </div>
          <Link href="/uretilen-belgeler/yeni" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Dilekçe
          </Link>
        </div>

        {!documents || documents.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-lg text-primary mb-2">Henüz dilekçeniz yok</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">
              İlk dilekçenizi AI ile oluşturmak için aşağıya tıklayın.
            </p>
            <Link href="/uretilen-belgeler/yeni" className="btn-primary">
              İlk Dilekçeyi Oluştur
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-primary truncate">
                    {doc.title || TYPE_LABELS[doc.document_type] || "Dilekçe"}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-body text-muted-foreground">
                      {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                    </span>
                    <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {doc.file_path ? (
                    <a
                      href={`/api/documents/download/${doc.id}`}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-body font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      İndir
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground font-body">Metin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-muted rounded-xl p-4 border border-border">
          <p className="font-body text-xs text-muted-foreground text-center">
            ⚠️ AI ile üretilen belgeler hukuki tavsiye niteliği taşımaz. Resmi işlemler için avukata danışın.
          </p>
        </div>
      </main>
    </div>
  );
}
