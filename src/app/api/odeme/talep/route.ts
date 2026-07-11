import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createPaymentRequest } from "@/lib/odeme";
import { getIbanBilgi, sendAdminPaymentRequestEmail } from "@/lib/email/odeme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Paket seçimi → pending payment_request + referans kodu + IBAN bilgisi
export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const body = await request.json() as { packageCode?: string };
    if (!body.packageCode) {
      return NextResponse.json({ error: "Paket seçimi zorunludur" }, { status: 400 });
    }

    const svc = createServiceClient() as Any;
    const { data: pkg } = await svc
      .from("credit_packages")
      .select("code, name, price_try, query_quota")
      .eq("code", body.packageCode)
      .eq("is_active", true)
      .single();

    if (!pkg) return NextResponse.json({ error: "Geçersiz paket" }, { status: 400 });

    const amountTry = Math.round(Number(pkg.price_try));

    // Mükerrer talep engeli: aynı kullanıcı + paket için bekleyen talep varsa
    // yenisini (ve yeni admin mailini) oluşturma, mevcut bilgileri döndür
    const { data: bekleyen } = await svc
      .from("payment_requests")
      .select("reference_code, amount_try")
      .eq("user_id", user.id)
      .eq("package_code", pkg.code)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (bekleyen && bekleyen.length > 0) {
      const { iban, hesapAdi } = getIbanBilgi();
      return NextResponse.json({
        referenceCode: bekleyen[0].reference_code,
        amountTry: bekleyen[0].amount_try,
        packageName: pkg.name,
        queryQuota: pkg.query_quota,
        iban,
        hesapAdi,
        adminNotified: true,
        existing: true,
      });
    }
    const req = await createPaymentRequest(svc, user.id, pkg.code, amountTry);
    if (!req) return NextResponse.json({ error: "Talep oluşturulamadı. Lütfen tekrar deneyin." }, { status: 500 });

    const { data: profile } = await svc
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Admin bildirimi — mail hatası talebi engellemez
    const adminEmailId = await sendAdminPaymentRequestEmail({
      userEmail: profile?.email ?? user.email ?? "",
      userName: profile?.full_name ?? "Bilinmiyor",
      packageName: pkg.name,
      amountTry,
      referenceCode: req.reference_code,
      approvalToken: req.approval_token,
    });

    console.log(`[odeme/talep] ref=${req.reference_code} adminEmailId=${adminEmailId}`);

    const { iban, hesapAdi } = getIbanBilgi();
    return NextResponse.json({
      referenceCode: req.reference_code,
      amountTry,
      packageName: pkg.name,
      queryQuota: pkg.query_quota,
      iban,
      hesapAdi,
      adminNotified: adminEmailId !== null,
    });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
