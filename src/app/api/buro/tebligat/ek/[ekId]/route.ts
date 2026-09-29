import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Tebligat ekini indir — imzalı URL'ye 302 (aynı desen: dava/belge/[docId]).
export async function GET(_request: Request, { params }: { params: { ekId: string } }) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data: ek } = await svc
    .from("tebligat_ekler")
    .select("id, lawyer_id, ad, storage_path, durum")
    .eq("id", params.ekId)
    .single();

  if (!ek) return Response.json({ error: "Ek bulunamadı" }, { status: 404 });
  if (ek.lawyer_id !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
  if (ek.durum !== "indirildi" || !ek.storage_path) {
    return Response.json({ error: "Bu ek indirilemedi, kaynağını UYAP/UETS ekranından görüntüleyin" }, { status: 404 });
  }

  const { data: signed, error } = await svc.storage
    .from("documents")
    .createSignedUrl(ek.storage_path, 300, { download: ek.ad });

  if (error || !signed?.signedUrl) {
    return Response.json({ error: "Bağlantı oluşturulamadı" }, { status: 500 });
  }

  return Response.redirect(signed.signedUrl, 302);
}
