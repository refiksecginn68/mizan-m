import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Token ile talep bilgisini getir (public)
export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const svc = createServiceClient() as Any;

  const { data: req } = await svc
    .from("document_requests")
    .select(`
      id, token, status, message, expires_at,
      clients (id, full_name),
      cases (id, title, case_number),
      lawyer:lawyer_id (full_name)
    `)
    .eq("token", params.token)
    .single();

  if (!req) return Response.json({ error: "Link geçersiz veya süresi dolmuş" }, { status: 404 });

  if (req.status === "expired" || new Date(req.expires_at as string) < new Date()) {
    return Response.json({ error: "Bu linkin süresi dolmuştur" }, { status: 410 });
  }

  return Response.json({
    clientName: (req.clients as Any)?.full_name,
    lawyerName: (req.lawyer as Any)?.full_name,
    caseName: (req.cases as Any)?.title,
    caseNumber: (req.cases as Any)?.case_number,
    message: req.message,
    expiresAt: req.expires_at,
    status: req.status,
  });
}

// Dosya yükleme (public — token yeterli)
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const svc = createServiceClient() as Any;

  // Token doğrula
  const { data: req } = await svc
    .from("document_requests")
    .select("id, lawyer_id, client_id, case_id, status, expires_at")
    .eq("token", params.token)
    .single();

  if (!req) return Response.json({ error: "Geçersiz link" }, { status: 404 });
  if (req.status === "expired" || new Date(req.expires_at as string) < new Date()) {
    return Response.json({ error: "Linkin süresi dolmuştur" }, { status: 410 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const note = (formData.get("note") as string) ?? "";

  if (!files.length) return Response.json({ error: "Dosya seçilmedi" }, { status: 400 });

  const uploaded: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) {
      errors.push(`${file.name}: Maksimum 20MB`);
      continue;
    }

    const buf = await file.arrayBuffer();
    const storagePath = `requests/${params.token}/${Date.now()}-${file.name}`;

    const { error: uploadErr } = await svc.storage
      .from("case-documents")
      .upload(storagePath, buf, { contentType: file.type });

    let fileUrl: string | null = null;
    if (!uploadErr) {
      const { data: urlData } = svc.storage.from("case-documents").getPublicUrl(storagePath);
      fileUrl = urlData?.publicUrl ?? null;
    }

    // case_documents tablosuna kaydet
    await svc.from("case_documents").insert({
      case_id: req.case_id ?? null,
      lawyer_id: req.lawyer_id,
      file_name: file.name,
      file_type: file.type,
      file_path: fileUrl ?? storagePath,
      notes: note ? `Müvekkil yükledi: ${note}` : "Müvekkil belge talebi üzerinden yüklendi",
      metadata: {
        uploaded_via: "belge_talep",
        request_token: params.token,
        client_id: req.client_id,
      },
    });

    uploaded.push(file.name);
  }

  // Talebi tamamlandı olarak işaretle (tüm dosyalar yüklendiyse)
  if (uploaded.length > 0) {
    await svc.from("document_requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("token", params.token);
  }

  return Response.json({ success: true, uploaded, errors });
}
