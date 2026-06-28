/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const Iyzipay = require("iyzipay");

type CreditPackage = Database["public"]["Tables"]["credit_packages"]["Row"];
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "full_name" | "email">;

export async function POST(req: NextRequest) {
  try {
    // Auth kontrolü
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    // İstekten packageId al
    const body = await req.json();
    const { packageId } = body as { packageId: string };

    if (!packageId) {
      return NextResponse.json({ error: "Paket ID gereklidir" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Paketi DB'den çek
    const pkgResult = await (serviceClient
      .from("credit_packages")
      .select("*")
      .eq("id", packageId)
      .eq("is_active", true)
      .single() as any) as Promise<{ data: CreditPackage | null; error: any }>;

    const { data: pkg, error: pkgError } = await pkgResult;

    if (pkgError || !pkg) {
      return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
    }

    // Kullanıcı profilini çek
    const profileResult = await (serviceClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single() as any) as Promise<{ data: Profile | null; error: any }>;

    const { data: profile, error: profileError } = await profileResult;

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
    }

    // iyzico API key yoksa hata döndür
    if (!process.env.IYZICO_API_KEY) {
      return NextResponse.json(
        { error: "Ödeme sistemi henüz aktif değil" },
        { status: 503 }
      );
    }

    // iyzico istemcisi oluştur
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    });

    const nameParts = (profile.full_name || "Kullanıcı Kullanıcı").split(" ");
    const firstName = nameParts[0] || "Kullanıcı";
    const lastName = nameParts.slice(1).join(" ") || "Kullanıcı";
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`;

    const iyzipayRequest = {
      locale: "tr",
      conversationId: crypto.randomUUID(),
      price: pkg.price_try.toString(),
      paidPrice: pkg.price_try.toString(),
      currency: "TRY",
      basketId: packageId,
      paymentGroup: "PRODUCT",
      callbackUrl,
      enabledInstallments: [1, 2, 3],
      buyer: {
        id: user.id,
        name: firstName,
        surname: lastName,
        gsmNumber: "+905550000000",
        email: user.email || profile.email,
        identityNumber: "11111111111",
        registrationAddress: "Türkiye",
        ip: "85.34.78.112",
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: profile.full_name || "Kullanıcı",
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      billingAddress: {
        contactName: profile.full_name || "Kullanıcı",
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      basketItems: [
        {
          id: packageId,
          name: `${pkg.name} Kredi Paketi`,
          category1: "Kredi",
          itemType: "VIRTUAL",
          price: pkg.price_try.toString(),
        },
      ],
      conversationData: `${user.id}:${packageId}`,
    };

    // Checkout form oluştur
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(
        iyzipayRequest,
        (err: Error | null, res: Record<string, unknown>) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
    });

    if (result.status !== "success") {
      console.error("iyzico hata:", result);
      return NextResponse.json(
        { error: (result.errorMessage as string) || "Ödeme formu oluşturulamadı" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      checkoutFormContent: result.checkoutFormContent as string,
      token: result.token as string,
    });
  } catch (error) {
    console.error("Checkout API hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}
