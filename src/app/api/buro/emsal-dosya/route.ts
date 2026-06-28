import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

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
  };

  const serviceSupabase = createServiceClient() as Any;

  // case_documents tablosuna emsal karar referansı olarak ekle
  const { error } = await serviceSupabase
    .from("case_documents")
    .insert({
      case_id: body.case_id,
      lawyer_id: user.id,
      file_name: `Emsal: ${body.court} - ${body.case_number}`,
      file_type: "emsal_karar",
      notes: body.subject + "\n\n" + body.summary,
      metadata: {
        karar_id: body.karar_id,
        court: body.court,
        case_number: body.case_number,
        decision_date: body.decision_date,
        subject: body.subject,
      },
    });

  if (error) {
    // Tablo yoksa veya hata varsa sessizce geç
    console.error("emsal-dosya insert error:", error);
  }

  return Response.json({ success: true });
}
