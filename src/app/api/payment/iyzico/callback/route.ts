/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const Iyzipay = require("iyzipay");

type CreditPackage = Database["public"]["Tables"]["credit_packages"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

export async function POST(req: NextRequest) {
  try {
    // iyzico form post verisini al
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/kredi?error=1`
      );
    }

    // iyzico API key yoksa hata dön
    if (!process.env.IYZICO_API_KEY) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/kredi?error=1`
      );
    }

    // iyzico istemcisi
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    });

    // Ödeme sonucunu doğrula
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(
        { locale: "tr", token },
        (err: Error | null, res: Record<string, unknown>) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
    });

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.error("Ödeme başarısız:", result);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/kredi?error=1`
      );
    }

    // conversationData'dan userId ve packageId parse et
    const conversationData = result.conversationData as string;
    if (!conversationData) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/kredi?error=1`
      );
    }

    const parts = conversationData.split(":");
    const userId = parts[0];
    const packageId = parts[1];

    if (!userId || !packageId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/kredi?error=1`
      );
    }

    const serviceClient = createServiceClient();

    // Paketi DB'den çek
    const pkgResult = await (serviceClient
      .from("credit_packages")
      .select("*")
      .eq("id", packageId)
      .single() as any) as Promise<{ data: CreditPackage | null; error: any }>;

    const { data: pkg, error: pkgError } = await pkgResult;

    if (pkgError || !pkg) {
      console.error("Paket bulunamadı:", pkgError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/kredi?error=1`
      );
    }

    // payments tablosuna kaydet
    const paymentData: PaymentInsert = {
      user_id: userId,
      amount: pkg.price_try,
      currency: "TRY",
      status: "success",
      provider: "iyzico",
      provider_payment_id: (result.paymentId as string) || token,
      description: `${pkg.name} Kredi Paketi (${pkg.credits} kredi)`,
      metadata: { token, packageId, conversationData },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const paymentInsertResult: { data: { id: string } | null; error: any } =
      await (serviceClient.from("payments") as any)
        .insert(paymentData)
        .select("id")
        .single();

    const payment = paymentInsertResult.data;

    // Kredileri ekle (atomik fonksiyon)
    const { error: creditError } = await (serviceClient as any).rpc("add_credits", {
      p_user_id: userId,
      p_amount: pkg.credits,
      p_description: `${pkg.name} paketi satın alındı (${pkg.credits} kredi)`,
      p_reference_id: payment?.id,
    });

    if (creditError) {
      console.error("Kredi ekleme hatası:", creditError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/kredi?error=1`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/kredi?success=1`
    );
  } catch (error) {
    console.error("Callback API hatası:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/kredi?error=1`
    );
  }
}
