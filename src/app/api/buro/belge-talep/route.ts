import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    client_id: string;
    case_id?: string;
    message?: string;
    phone?: string;
  };

  if (!body.client_id) return Response.json({ error: "Müvekkil gereklidir" }, { status: 400 });

  const svc = createServiceClient() as Any;

  // Müvekkil bilgisini çek
  const { data: client } = await svc
    .from("clients")
    .select("id, full_name, phone")
    .eq("id", body.client_id)
    .single();

  if (!client) return Response.json({ error: "Müvekkil bulunamadı" }, { status: 404 });

  // Talep oluştur
  const { data: req, error } = await svc
    .from("document_requests")
    .insert({
      lawyer_id: user.id,
      client_id: body.client_id,
      case_id: body.case_id ?? null,
      message: body.message ?? "Davanıza ait belgeleri yüklemenizi rica ederiz.",
    })
    .select("id, token, expires_at")
    .single();

  if (error) {
    // Tablo yoksa migration hatırlatması
    if (error.code === "42P01") {
      return Response.json({
        error: "document_requests tablosu bulunamadı. Supabase Dashboard'da 003_document_requests.sql migration'ını çalıştırın."
      }, { status: 500 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  const uploadLink = `${BASE_URL}/belge-yukle/${req.token as string}`;
  const phone = body.phone ?? (client.phone as string | null) ?? "";

  // SMS gönderimi
  let smsSent = false;
  let smsError = "";

  if (phone && process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD) {
    // Netgsm ile SMS
    try {
      const smsBody = `Sayın ${client.full_name}, avukatınız belge yüklemenizi istiyor. Link: ${uploadLink} (7 gün geçerli)`;
      const res = await fetch("https://api.netgsm.com.tr/sms/send/get/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      void res;
      // Gerçek Netgsm entegrasyonu için XML API gerekiyor
      smsSent = false;
      smsError = "Netgsm entegrasyonu yapılandırılmamış";
      void smsBody;
    } catch {
      smsError = "SMS gönderilemedi";
    }
  } else {
    smsError = "SMS servisi yapılandırılmamış (NETGSM_USERCODE gerekli)";
  }

  return Response.json({
    success: true,
    token: req.token,
    uploadLink,
    clientName: client.full_name,
    phone,
    smsSent,
    smsError,
    expiresAt: req.expires_at,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data } = await svc
    .from("document_requests")
    .select(`
      id, token, status, message, expires_at, created_at, completed_at,
      clients (id, full_name, phone),
      cases (id, title)
    `)
    .eq("lawyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return Response.json({ requests: data ?? [] });
}
