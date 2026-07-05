import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Emsal karar veya mevzuatı bir dava dosyasına bağlar
export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    case_id: string;
    karar_id: string;
    court: string;
    case_number: string;
    subject: string;
    summary: string;
    decision_date?: string;
    kind?: "emsal" | "mevzuat"; // varsayılan emsal
    source_url?: string;
  };

  if (!body.case_id || !body.karar_id) {
    return Response.json({ error: "case_id ve karar_id zorunludur" }, { status: 400 });
  }

  const serviceSupabase = createServiceClient() as Any;

  // Dava gerçekten bu avukata mı ait?
  const { data: caseRow } = await serviceSupabase
    .from("cases").select("id").eq("id", body.case_id).eq("lawyer_id", user.id).single();
  if (!caseRow) return Response.json({ error: "Dava bulunamadı" }, { status: 404 });

  const kind = body.kind === "mevzuat" ? "mevzuat" : "emsal_karar";
  const prefix = kind === "mevzuat" ? "Mevzuat" : "Emsal";

  const { error } = await serviceSupabase
    .from("case_documents")
    .insert({
      case_id: body.case_id,
      lawyer_id: user.id,
      name: `${prefix}: ${body.court} - ${body.case_number}`,
      // Şemada NOT NULL — dosya değil referans kaydı olduğundan sentinel değerler
      storage_path: "",
      file_size: 0,
      file_type: kind,
      ai_summary: `${body.subject}\n\n${body.summary}`,
      // Yapılandırılmış karar metadatası ("Yeni Sekmede Aç" için)
      ai_risks: {
        karar_id: body.karar_id,
        court: body.court,
        case_number: body.case_number,
        decision_date: body.decision_date ?? null,
        source_url: body.source_url ?? null,
        kind,
      },
    });

  if (error) {
    console.error("emsal-dosya insert error:", error);
    return Response.json({ error: "Dosyaya eklenemedi" }, { status: 500 });
  }

  return Response.json({ success: true });
}
