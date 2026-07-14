import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// KVKK veri taşınabilirliği: kullanıcının kişisel verilerini JSON olarak indirir
export async function GET() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const [{ data: profile }, { data: transactions }, { data: payments }] = await Promise.all([
    svc.from("profiles").select("*").eq("id", user.id).single(),
    svc.from("credit_transactions").select("amount, type, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    svc.from("payment_requests").select("package_code, amount_try, reference_code, receipt_no, status, created_at, approved_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const veri = {
    indirme_tarihi: new Date().toISOString(),
    hesap: { id: user.id, email: user.email, olusturulma: user.created_at },
    profil: profile ?? null,
    kredi_islemleri: transactions ?? [],
    odeme_talepleri: payments ?? [],
  };

  return new Response(JSON.stringify(veri, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mizanim-verilerim-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
