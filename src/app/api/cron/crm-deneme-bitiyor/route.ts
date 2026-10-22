import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendCrmDenemeBitiyorMaili } from "@/lib/email/crm";
import { crmBildirimGonder } from "@/lib/crm-bildirim";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Günlük çalışır: bitişine 1-2 gün kalan, hâlâ denemede olan (paket almamış)
// avukat hesapları için CRM'e "deneme bitiyor" bildirimi atar. Her kullanıcı
// için en fazla bir kez (crm_bildirim_log idempotency).
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const svc = createServiceClient() as Any;
  const now = Date.now();
  const pencereBaslangic = new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString();
  const pencereBitis = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles } = await svc
    .from("profiles")
    .select("id, email, trial_ends_at, is_test_account, monthly_query_limit, additional_queries")
    .eq("user_type", "avukat")
    .not("trial_started_at", "is", null)
    .gte("trial_ends_at", pencereBaslangic)
    .lt("trial_ends_at", pencereBitis)
    .eq("monthly_query_limit", 0)
    .eq("additional_queries", 0);

  const sonuclar: Array<{ userId: string; gonderildi: boolean }> = [];

  for (const p of profiles ?? []) {
    const gonderildi = await crmBildirimGonder(svc, "deneme_bitiyor", p.id, p.id, () =>
      sendCrmDenemeBitiyorMaili({
        email: p.email,
        paket: "Deneme (Avukat)",
        bitisTarihi: new Date(p.trial_ends_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
        isTest: !!p.is_test_account,
      })
    );
    sonuclar.push({ userId: p.id, gonderildi });
  }

  return NextResponse.json({ processed: sonuclar.length, sonuclar });
}
