import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const dynamic = "force-dynamic";

type HesapTipi = "test" | "deneme" | "ucretli" | "ucretsiz";
type OdemeDurumu = "odedi" | "odemedi" | "gecikmis";

interface CrmUyelik {
  email: string;
  paket: string | null;
  hesap_tipi: HesapTipi;
  durum: "aktif" | "pasif";
  odeme_durumu: OdemeDurumu;
  aylik_tutar: number | null;
  para_birimi: "TRY";
  kayit_tarihi: string;
  son_odeme_tarihi: string | null;
  deneme_bitis: string | null;
}

interface SonOdeme {
  status: string;
  createdAt: string;
  approvedAt: string | null;
}

const GECIKME_ESIGI_MS = 7 * 24 * 60 * 60 * 1000;

// CRM'in (crm.dravoxai.com) üyelik/ödeme verisini okuduğu tek endpoint.
// Salt okunur — sadece izin verilen 10 alan döner, Supabase kimlik bilgisi
// CRM'e hiç verilmez, yerine tek bir paylaşılan token kullanılır.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRM_READONLY_TOKEN || auth !== `Bearer ${process.env.CRM_READONLY_TOKEN}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const svc = createServiceClient() as Any;

  const { data: profiles, error } = await svc
    .from("profiles")
    .select(
      "id, email, user_type, is_active, is_test_account, created_at, trial_started_at, trial_ends_at, monthly_query_limit, additional_queries, uyap_uets_active"
    );

  if (error) {
    return NextResponse.json({ error: "Sorgu hatası" }, { status: 500 });
  }

  const userIds = (profiles ?? []).map((p: Any) => p.id);

  const [{ data: paymentRequests }, { data: payments }, { data: packages }] = await Promise.all([
    svc
      .from("payment_requests")
      .select("user_id, status, created_at, approved_at")
      .in("user_id", userIds),
    svc
      .from("payments")
      .select("user_id, status, created_at")
      .in("user_id", userIds),
    svc.from("credit_packages").select("code, price_try"),
  ]);

  const fiyatByKod = new Map<string, number>(
    (packages ?? []).map((pkg: Any) => [pkg.code, pkg.price_try])
  );

  const sonOdemeByUser = new Map<string, SonOdeme>();
  for (const pr of paymentRequests ?? []) {
    const mevcut = sonOdemeByUser.get(pr.user_id);
    if (!mevcut || pr.created_at > mevcut.createdAt) {
      sonOdemeByUser.set(pr.user_id, {
        status: pr.status,
        createdAt: pr.created_at,
        approvedAt: pr.approved_at,
      });
    }
  }
  for (const pay of payments ?? []) {
    const mevcut = sonOdemeByUser.get(pay.user_id);
    if (!mevcut || pay.created_at > mevcut.createdAt) {
      sonOdemeByUser.set(pay.user_id, {
        status: pay.status === "success" ? "approved" : pay.status,
        createdAt: pay.created_at,
        approvedAt: pay.status === "success" ? pay.created_at : null,
      });
    }
  }

  const now = Date.now();

  const sonuc: CrmUyelik[] = (profiles ?? []).map((p: Any) => {
    const sonOdeme = sonOdemeByUser.get(p.id);

    const paket = p.uyap_uets_active
      ? "max"
      : (p.monthly_query_limit ?? 0) >= 750
        ? "pro"
        : p.user_type === "vatandas"
          ? "vatandas"
          : null;

    const denemeAktif =
      p.user_type === "avukat" &&
      !!p.trial_started_at &&
      !!p.trial_ends_at &&
      new Date(p.trial_ends_at).getTime() > now &&
      (p.monthly_query_limit ?? 0) === 0 &&
      (p.additional_queries ?? 0) === 0;

    const ucretliMi =
      (p.monthly_query_limit ?? 0) > 0 ||
      (p.additional_queries ?? 0) > 0 ||
      sonOdeme?.status === "approved";

    const hesapTipi: HesapTipi = p.is_test_account
      ? "test"
      : denemeAktif
        ? "deneme"
        : ucretliMi
          ? "ucretli"
          : "ucretsiz";

    const odemeDurumu: OdemeDurumu = !sonOdeme
      ? "odemedi"
      : sonOdeme.status === "approved"
        ? "odedi"
        : sonOdeme.status === "pending" && now - new Date(sonOdeme.createdAt).getTime() > GECIKME_ESIGI_MS
          ? "gecikmis"
          : "odemedi";

    return {
      email: p.email,
      paket,
      hesap_tipi: hesapTipi,
      durum: p.is_active ? "aktif" : "pasif",
      odeme_durumu: odemeDurumu,
      aylik_tutar: paket ? fiyatByKod.get(paket) ?? null : null,
      para_birimi: "TRY",
      kayit_tarihi: p.created_at,
      son_odeme_tarihi: sonOdeme?.approvedAt ?? null,
      deneme_bitis: p.trial_ends_at ?? null,
    };
  });

  return NextResponse.json(sonuc);
}
