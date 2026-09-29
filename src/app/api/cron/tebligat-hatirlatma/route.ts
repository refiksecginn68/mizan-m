import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ESIK_GUNLER = [7, 3, 1];

function gunFarki(tarih: string): number {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const hedef = new Date(tarih); hedef.setHours(0, 0, 0, 0);
  return Math.round((hedef.getTime() - bugun.getTime()) / 86400000);
}

// Günlük çalışır: deadline_at'i 7/3/1 gün kalan, işlenmemiş tebligatlar için
// push bildirimi gönderir. Aynı eşik için ikinci kez göndermez
// (notified_thresholds sütununda hangi eşiklerin gönderildiği tutulur).
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const svc = createServiceClient() as Any;
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const enUzakSinir = new Date(bugun); enUzakSinir.setDate(enUzakSinir.getDate() + 7);

  const { data: rows } = await svc
    .from("tebligat_records")
    .select("id, lawyer_id, subject, deadline_at, is_processed, notified_thresholds")
    .not("deadline_at", "is", null)
    .eq("is_processed", false)
    .lte("deadline_at", enUzakSinir.toISOString())
    .gte("deadline_at", bugun.toISOString());

  let gonderildi = 0;
  for (const r of rows ?? []) {
    const kalan = gunFarki(r.deadline_at);
    const esik = ESIK_GUNLER.find((e) => e === kalan);
    if (!esik) continue;

    const gonderilenler: number[] = r.notified_thresholds ?? [];
    if (gonderilenler.includes(esik)) continue;

    try {
      await sendPushNotification(r.lawyer_id, {
        title: `Tebligat süresi ${esik} gün kaldı`,
        body: r.subject,
        url: "/buro/tebligat",
      });
      await svc.from("tebligat_records")
        .update({ notified_thresholds: [...gonderilenler, esik] })
        .eq("id", r.id);
      gonderildi++;
    } catch {
      // bir bildirimin başarısız olması diğerlerini durdurmaz
    }
  }

  return NextResponse.json({ ok: true, gonderildi });
}
