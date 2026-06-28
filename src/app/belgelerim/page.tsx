import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VatandasHeader from "@/components/shared/VatandasHeader";
import UploadZone from "@/components/documents/UploadZone";
import { FileText, Calendar, Eye } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  analysis_status: string | null;
}

export default async function BelgelerimPage() {
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
    .from("documents")
    .select("id, file_name, file_type, file_size, created_at, analysis_status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50) as { data: Document[] | null };

  return (
    <div className="min-h-screen bg-background">
      <VatandasHeader fullName={profile.full_name} creditBalance={profile.credit_balance} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-primary">Belgelerim</h1>
          <p className="font-body text-muted-foreground mt-1">
            Sözleşme, mahkeme kararı veya diğer belgelerinizi yükleyin, AI ile analiz ettirin.
          </p>
        </div>

        {/* Upload */}
        <div className="card mb-8">
          <h2 className="font-heading text-base font-bold text-primary mb-4">Yeni Belge Yükle</h2>
          <UploadZone />
          <p className="font-body text-xs text-muted-foreground mt-3">
            Desteklenen formatlar: PDF, JPG, PNG, WebP · Maks. 10 MB
          </p>
        </div>

        {/* Belgeler Listesi */}
        <div>
          <h2 className="font-heading text-base font-bold text-primary mb-4">
            Yüklenen Belgeler
            {documents && documents.length > 0 && (
              <span className="ml-2 text-sm font-body font-normal text-muted-foreground">
                ({documents.length})
              </span>
            )}
          </h2>

          {!documents || documents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">
                Henüz yüklenen belge yok. Yukarıdan ilk belgenizi yükleyin.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-primary truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="font-body text-xs text-muted-foreground">
                        {(doc.file_size / 1024).toFixed(0)} KB
                      </span>
                      <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.created_at).toLocaleDateString("tr-TR")}
                      </span>
                      {doc.analysis_status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                          doc.analysis_status === "completed"
                            ? "bg-success/10 text-success"
                            : "bg-accent/10 text-accent"
                        }`}>
                          {doc.analysis_status === "completed" ? "Analiz edildi" : "Bekliyor"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/asistan?doc=${doc.id}`}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-body font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Analiz Et
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 bg-muted rounded-xl p-4 border border-border">
          <p className="font-body text-xs text-muted-foreground text-center">
            ⚠️ Belgeleriniz güvenli şekilde saklanır. 90 gün sonra otomatik silinir.
          </p>
        </div>
      </main>
    </div>
  );
}
