import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendAdminPaymentRequestEmail } from "@/lib/email/odeme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Kullanıcı havaleyi yaptıktan sonra dekont no + açıklama ile ödeme bildirimi
// gönderir → talep admin onayına düşer, admin'e detaylı mail gider.
export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const body = await request.json() as { referenceCode?: string; receiptNo?: string; note?: string };
    const receiptNo = (body.receiptNo ?? "").trim().slice(0, 100);
    const note = (body.note ?? "").trim().slice(0, 500);
    if (!body.referenceCode || !receiptNo) {
      return NextResponse.json({ error: "Dekont / işlem numarası zorunludur" }, { status: 400 });
    }

    const svc = createServiceClient() as Any;
    const { data: req } = await svc
      .from("payment_requests")
      .select("id, package_code, amount_try, reference_code, approval_token, status")
      .eq("reference_code", body.referenceCode)
      .eq("user_id", user.id)
      .single();

    if (!req) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    if (req.status !== "pending") {
      return NextResponse.json({ error: "Bu talep zaten işlenmiş" }, { status: 400 });
    }

    await svc
      .from("payment_requests")
      .update({ receipt_no: receiptNo, payer_note: note || null, notified_at: new Date().toISOString() })
      .eq("id", req.id);

    const [{ data: pkg }, { data: profile }] = await Promise.all([
      svc.from("credit_packages").select("name").eq("code", req.package_code).single(),
      svc.from("profiles").select("full_name, email").eq("id", user.id).single(),
    ]);

    // Admin bildirimi — mail hatası bildirimi engellemez
    const adminEmailId = await sendAdminPaymentRequestEmail({
      userEmail: profile?.email ?? user.email ?? "",
      userName: profile?.full_name ?? "Bilinmiyor",
      packageName: pkg?.name ?? req.package_code,
      amountTry: req.amount_try,
      referenceCode: req.reference_code,
      approvalToken: req.approval_token,
      receiptNo,
      payerNote: note || null,
      bildirimTarihi: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
    });

    console.log(`[odeme/bildirim] ref=${req.reference_code} dekont=${receiptNo} adminEmailId=${adminEmailId}`);

    return NextResponse.json({ success: true, adminNotified: adminEmailId !== null });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
