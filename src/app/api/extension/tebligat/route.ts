import { createServiceClient } from "@/lib/supabase/server";
import { verifyExtensionToken } from "@/lib/extension-token";
import { sendPushNotification } from "@/lib/push";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface UetsTebligat {
  barkod?: string;
  gonderen?: string;
  konu?: string;
  tebligTarihi?: string;
  esasNo?: string;
  okundu?: boolean;
}

function getToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

// UETS eklenti modülünden okunan tebligatları tebligat_records tablosuna aktarır.
// Tekilleştirme: barkod (content içinde) veya gönderen+konu+tarih üçlüsü.
export async function POST(request: Request) {
  const token = getToken(request);
  const verified = token ? verifyExtensionToken(token) : null;
  if (!verified) return Response.json({ error: "Geçersiz veya süresi dolmuş bağlantı kodu" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data: profile } = await svc
    .from("profiles").select("user_type").eq("id", verified.userId).single();
  if (!profile || profile.user_type !== "avukat") {
    return Response.json({ error: "Avukat hesabı bulunamadı" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { tebligatlar?: UetsTebligat[] } | null;
  const tebligatlar = (body?.tebligatlar ?? []).filter((t) => t.konu?.trim() || t.barkod);
  if (tebligatlar.length === 0) {
    return Response.json({ error: "Aktarılacak tebligat bulunamadı" }, { status: 400 });
  }

  // Mevcut kayıtlar (tekilleştirme için) — şema: uets_id (barkod), notes, is_processed
  const { data: existingRows } = await svc
    .from("tebligat_records")
    .select("id, subject, sender, received_at, uets_id")
    .eq("lawyer_id", verified.userId);
  const existing = (existingRows ?? []) as Array<{ id: string; subject: string; sender: string; received_at: string | null; uets_id: string | null }>;

  let eklendi = 0, guncellendi = 0, hata = 0;

  for (const t of tebligatlar.slice(0, 100)) {
    try {
      const subject = (t.konu ?? "UETS Tebligatı").slice(0, 200);
      const sender = (t.gonderen ?? "UETS").slice(0, 150);

      const dup = existing.find((e) =>
        (t.barkod && e.uets_id === t.barkod) ||
        (e.subject === subject && e.sender === sender && (e.received_at ?? "").slice(0, 10) === (t.tebligTarihi ?? ""))
      );

      if (dup) {
        if (t.okundu != null) {
          await svc.from("tebligat_records").update({ is_processed: t.okundu }).eq("id", dup.id);
        }
        guncellendi++;
        continue;
      }

      // Esas no varsa mevcut dosyayla eşleştir
      let caseId: string | null = null;
      if (t.esasNo) {
        const { data: kase } = await svc
          .from("cases").select("id")
          .eq("lawyer_id", verified.userId)
          .eq("case_number", t.esasNo)
          .maybeSingle();
        caseId = kase?.id ?? null;
      }

      const notes = [
        t.esasNo ? `Esas No: ${t.esasNo}` : "",
        "UETS eklenti modülünden aktarıldı.",
      ].filter(Boolean).join("\n");

      const { data: insertedRec, error } = await svc.from("tebligat_records").insert({
        lawyer_id: verified.userId,
        case_id: caseId,
        uets_id: t.barkod ?? null,
        sender,
        subject,
        received_at: t.tebligTarihi ? `${t.tebligTarihi}T09:00:00Z` : new Date().toISOString(),
        is_processed: t.okundu ?? false,
        notes,
      }).select("id").single();

      if (error) {
        hata++;
      } else {
        eklendi++;
        
        const bodyText = `${sender}: ${subject}`;
        await svc.from("notifications").insert({
          user_id: verified.userId,
          type: "tebligat",
          title: "Yeni Tebligat Alındı",
          body: bodyText,
          reference_id: insertedRec?.id || null,
        });

        const { data: profile } = await svc
          .from("profiles")
          .select("notify_tebligat")
          .eq("id", verified.userId)
          .single();

        if (profile?.notify_tebligat !== false) {
          await sendPushNotification(verified.userId, {
            title: "Yeni Tebligat Alındı",
            body: bodyText,
            url: "/buro/tebligat",
          });
        }
      }
    } catch {
      hata++;
    }
  }

  return Response.json({ success: true, eklendi, guncellendi, hata });
}
