import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

// Kabul edilen uzantılar (UDF dahil — UYAP belge formatı)
const ALLOWED_EXT = [
  "pdf", "udf", "doc", "docx", "xls", "xlsx", "txt", "rtf",
  "png", "jpg", "jpeg", "webp", "gif", "tif", "tiff", "zip", "eyp",
];

// Dava dosyasına belge yükle
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const svc = createServiceClient() as Any;

    // Dava bu avukata mı ait?
    const { data: caseRow } = await svc
      .from("cases").select("id").eq("id", params.id).eq("lawyer_id", user.id).single();
    if (!caseRow) return Response.json({ error: "Dava bulunamadı" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "Dosya bulunamadı" }, { status: 400 });
    if (file.size > MAX_SIZE) return Response.json({ error: "Dosya boyutu 25 MB'ı aşamaz" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      return Response.json({ error: `Desteklenmeyen dosya türü: .${ext}` }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `case/${user.id}/${params.id}/${Date.now()}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: storageError } = await svc.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage error:", storageError.message);
      return Response.json({ error: "Dosya depolamaya yüklenemedi" }, { status: 500 });
    }

    const { data: doc, error: dbError } = await svc
      .from("case_documents")
      .insert({
        case_id: params.id,
        lawyer_id: user.id,
        name: file.name,
        storage_path: storagePath,
        file_type: ext,
        file_size: file.size,
      })
      .select("id, name, file_type, file_size, created_at")
      .single();

    if (dbError) {
      console.error("case_documents insert error:", dbError);
      return Response.json({ error: "Belge kaydedilemedi" }, { status: 500 });
    }

    return Response.json({ success: true, document: doc });
  } catch (err) {
    console.error("Belge yükleme hatası:", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// Dava belgelerini listele
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data } = await svc
    .from("case_documents")
    .select("id, name, file_type, file_size, ai_summary, ai_risks, created_at")
    .eq("case_id", params.id)
    .eq("lawyer_id", user.id)
    .order("created_at", { ascending: false });

  return Response.json({ documents: data ?? [] });
}
