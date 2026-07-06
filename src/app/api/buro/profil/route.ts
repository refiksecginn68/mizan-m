import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const AVATAR_MAX = 5 * 1024 * 1024; // 5 MB
const DOC_MAX = 15 * 1024 * 1024; // 15 MB
const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function getLawyer() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null };
  const svc = createServiceClient() as Any;
  const { data: profile } = await svc.from("profiles").select("user_type").eq("id", user.id).single();
  if (!profile || profile.user_type !== "avukat") return { user: null };
  return { user, svc };
}

// Profil bilgilerini getir (belgeler için imzalı URL'lerle)
export async function GET() {
  const { user, svc } = await getLawyer();
  if (!user) return Response.json({ error: "Avukat oturumu gerekli" }, { status: 401 });

  const { data: profile, error } = await svc
    .from("profiles")
    .select("full_name, email, phone, avatar_url, bar_city, bar_number, university, specializations, achievements, hobbies, personal_notes, profile_documents")
    .eq("id", user.id)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Ek belgeler için kısa süreli imzalı URL üret
  const docs = ((profile.profile_documents as Array<{ name: string; path: string }>) ?? []);
  const withUrls = await Promise.all(docs.map(async (d) => {
    const { data: signed } = await svc.storage.from("documents").createSignedUrl(d.path, 3600);
    return { ...d, url: signed?.signedUrl ?? null };
  }));

  return Response.json({ profile: { ...profile, profile_documents: withUrls } });
}

// Profil alanlarını güncelle (JSON)
export async function PATCH(request: Request) {
  const { user, svc } = await getLawyer();
  if (!user) return Response.json({ error: "Avukat oturumu gerekli" }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

  // Yalnızca izin verilen alanlar güncellenir
  const allowed = ["full_name", "phone", "bar_city", "bar_number", "university", "specializations", "achievements", "hobbies", "personal_notes"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (typeof update.full_name === "string" && !(update.full_name as string).trim()) {
    return Response.json({ error: "Ad-soyad boş olamaz" }, { status: 400 });
  }
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await svc.from("profiles").update(update).eq("id", user.id)
    .select("full_name, phone, bar_city, bar_number, university, specializations, achievements, hobbies, personal_notes")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, profile: data });
}

// Dosya yükleme: avatar (kind=avatar) veya ek belge (kind=belge)
export async function POST(request: Request) {
  const { user, svc } = await getLawyer();
  if (!user) return Response.json({ error: "Avukat oturumu gerekli" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "belge");
  if (!(file instanceof File)) return Response.json({ error: "Dosya gerekli" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  if (kind === "avatar") {
    if (!IMG_TYPES.includes(file.type)) {
      return Response.json({ error: "Profil fotoğrafı JPEG/PNG/WEBP olmalı" }, { status: 400 });
    }
    if (file.size > AVATAR_MAX) return Response.json({ error: "Fotoğraf 5 MB'ı aşamaz" }, { status: 413 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await svc.storage.from("documents").upload(path, buffer, {
      contentType: file.type, upsert: true,
    });
    if (upErr) return Response.json({ error: "Fotoğraf yüklenemedi: " + upErr.message }, { status: 500 });

    // documents bucket private — 1 yıllık imzalı URL avatar_url'e yazılır
    const { data: signed } = await svc.storage.from("documents").createSignedUrl(path, 60 * 60 * 24 * 365);
    const avatarUrl = signed?.signedUrl ?? null;
    await svc.from("profiles").update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
    return Response.json({ success: true, avatar_url: avatarUrl });
  }

  // Ek belge (diploma, sertifika vb.)
  if (file.size > DOC_MAX) return Response.json({ error: "Belge 15 MB'ı aşamaz" }, { status: 413 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/profil-belge/${Date.now()}-${safeName}`;
  const { error: upErr } = await svc.storage.from("documents").upload(path, buffer, {
    contentType: file.type || "application/octet-stream", upsert: false,
  });
  if (upErr) return Response.json({ error: "Belge yüklenemedi: " + upErr.message }, { status: 500 });

  const { data: profile } = await svc.from("profiles").select("profile_documents").eq("id", user.id).single();
  const docs = ((profile?.profile_documents as Array<{ name: string; path: string }>) ?? []);
  docs.push({ name: file.name, path });
  await svc.from("profiles").update({ profile_documents: docs, updated_at: new Date().toISOString() }).eq("id", user.id);

  const { data: signed } = await svc.storage.from("documents").createSignedUrl(path, 3600);
  return Response.json({ success: true, document: { name: file.name, path, url: signed?.signedUrl ?? null } });
}
