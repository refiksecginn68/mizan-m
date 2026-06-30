import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Dosya 20 MB'ı aşamaz" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Sadece PDF, JPG veya PNG yükleyebilirsiniz" }, { status: 400 });
    }

    const serviceClient = createServiceClient() as AnyClient;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/uyap/${Date.now()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Storage'a yükle — hata olsa da DB kaydına devam et
    const { error: storageError } = await serviceClient.storage
      .from("documents")
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (storageError) console.warn("UYAP belge storage hatası:", storageError.message);

    // documents tablosuna kaydet
    const { data: doc, error: dbError } = await serviceClient
      .from("documents")
      .insert({
        user_id: user.id,
        name: `[UYAP] ${file.name}`,
        storage_path: storageError ? null : storagePath,
        file_type: file.type,
        file_size: file.size,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("UYAP belge DB hatası:", dbError);
      return NextResponse.json({ error: "Belge kaydedilemedi" }, { status: 500 });
    }

    return NextResponse.json({ success: true, documentId: doc.id });
  } catch (err) {
    console.error("UYAP belge yükleme hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
