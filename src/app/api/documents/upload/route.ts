import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userClient = createClient() as any;
    const { data: { user } } = await userClient.auth.getUser();

    if (!user) {
      return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    // Kredi kontrolü
    const { data: profile } = await userClient
      .from("profiles")
      .select("credit_balance")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credit_balance < 5) {
      return Response.json({ error: "Belge analizi için 5 kredi gerekiyor" }, { status: 402 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return Response.json({ error: "Dosya boyutu 10 MB'ı aşamaz" }, { status: 400 });
    }

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return Response.json({ error: "Desteklenmeyen dosya türü" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceClient = createServiceClient() as any;

    // Supabase Storage'a yükle
    const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: storageError } = await serviceClient.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      // Storage bucket yoksa sadece DB kaydı yap
      console.error("Storage error:", storageError.message);
    }

    // DB kaydı (tablo şeması: name, storage_path, file_type, file_size)
    const { data: doc, error: dbError } = await serviceClient
      .from("documents")
      .insert({
        user_id: user.id,
        name: file.name,
        storage_path: storageError ? null : storagePath,
        file_type: file.type,
        file_size: file.size,
      })
      .select("id")
      .single();

    if (dbError) {
      return Response.json({ error: "Belge kaydedilemedi" }, { status: 500 });
    }

    return Response.json({ documentId: doc.id, success: true });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
