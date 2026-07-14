import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const DEMO_TEBLIGATLAR = [
  {
    sender: "İstanbul 3. Asliye Hukuk Mahkemesi",
    subject: "Duruşma Davetiyesi — 2024/1234 Esas",
    content: "Yukarıda esas numarası yazılı dava dosyası incelenerek tarafınıza duruşma daveti yapılmaktadır. Belirtilen tarih ve saatte mahkememizde hazır bulunmanız gerekmektedir.",
    daysToDeadline: 7,
    daysReceived: 3,
  },
  {
    sender: "İstanbul Anadolu İcra Dairesi",
    subject: "İcra Takip Başlatma Bildirimi",
    content: "Borçlu hakkında icra takibi başlatılmıştır. İtiraz süresi tebligat tarihinden itibaren 7 gündür.",
    daysToDeadline: 5,
    daysReceived: 2,
  },
  {
    sender: "Ankara 2. İdare Mahkemesi",
    subject: "Savunma İstemi — 2023/5678 Esas",
    content: "Sayın Avukat, davalı taraf olarak 30 gün içinde savunmanızı sunmanız gerekmektedir.",
    daysToDeadline: 22,
    daysReceived: 8,
  },
  {
    sender: "İstanbul Barosu",
    subject: "Zorunlu Mesleki Eğitim Bildirimi",
    content: "2024 yılı zorunlu mesleki eğitim katılım yükümlülüğünüze ilişkin bildirimdir.",
    daysToDeadline: 45,
    daysReceived: 1,
  },
];

export async function POST() {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

    const serviceSupabase = createServiceClient() as AnyClient;
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("user_type, uyap_tc")
      .eq("id", user.id)
      .single();

    if (profile?.user_type !== "avukat") {
      return NextResponse.json({ error: "Bu özellik sadece avukatlar içindir" }, { status: 403 });
    }

    // UETS tarama simülasyonu
    // Gerçek entegrasyon: UETS API (e-tebligat.uyap.gov.tr) baro sicil + e-imza ile token alır
    await new Promise((r) => setTimeout(r, 1500));

    const now = Date.now();
    const yeni: Array<{ esas_no?: string; sender: string; subject: string }> = [];

    for (const demo of DEMO_TEBLIGATLAR) {
      const receivedAt = new Date(now - demo.daysReceived * 24 * 3600 * 1000).toISOString();
      const deadlineAt = new Date(now + demo.daysToDeadline * 24 * 3600 * 1000).toISOString();

      // Aynı subject zaten var mı kontrol et
      const { data: existing } = await serviceSupabase
        .from("tebligat_records")
        .select("id")
        .eq("lawyer_id", user.id)
        .eq("subject", demo.subject)
        .single();

      if (existing) continue;

      const { data: insertedRec, error } = await serviceSupabase
        .from("tebligat_records")
        .insert({
          lawyer_id: user.id,
          sender: demo.sender,
          subject: demo.subject,
          content: demo.content,
          received_at: receivedAt,
          deadline_at: deadlineAt,
          status: "beklemede",
          is_read: false,
        })
        .select("id")
        .single();

      if (!error) {
        yeni.push({ sender: demo.sender, subject: demo.subject });
        
        const bodyText = `${demo.sender}: ${demo.subject}`;
        await serviceSupabase.from("notifications").insert({
          user_id: user.id,
          type: "tebligat",
          title: "Yeni Tebligat Alındı",
          body: bodyText,
          reference_id: insertedRec?.id || null,
        });

        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("notify_tebligat")
          .eq("id", user.id)
          .single();

        if (profile?.notify_tebligat !== false) {
          await sendPushNotification(user.id, {
            title: "Yeni Tebligat Alındı",
            body: bodyText,
            url: "/buro/tebligat",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      yeniSayi: yeni.length,
      yeniTebligatlar: yeni,
      demo: true,
    });
  } catch (err) {
    console.error("UETS tara error:", err);
    return NextResponse.json({ error: "Tarama sırasında hata oluştu" }, { status: 500 });
  }
}
