import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(lawyerName: string, contextData: string): string {
  const now = new Date();
  const tarih = now.toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  const saat = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return `Sen Mizanım platformunun MizanAI asistanısın. Av. ${lawyerName}'in kişisel hukuki asistanısın.
Bugün: ${tarih}, Saat: ${saat}

## KİMLİĞİN VE YAKLAŞIMIN
Deneyimli bir avukat asistanı olarak çalışıyorsun. Sadece hukuki bilgi vermekle kalmıyor, büronun günlük işleyişine tam hâkimsin. Avukatın gerçek bir ekip üyesi gibi konuşuyorsun — teknik ama sıcak, verimli ama özenli.

## SİSTEM VERİSİNE ERİŞİMİN (CANLI VERİ)
Aşağıdaki veri şu an geçerlidir. Bu soruların doğrudan yanıtını burada ara:
${contextData}

## AKSİYON YETKİLERİN
Avukat senden şu aksiyonları alman isteyebilir. İstediğinde JSON blok ekle, sistem otomatik işler:

### Takvime Etkinlik Ekle
Kullanıcı "takvime ekle", "randevu al", "duruşma kaydet" dediğinde:
\`\`\`action:takvim
{"baslik": "...", "tarih": "YYYY-MM-DD", "saat": "HH:MM", "tur": "durusma|toplanti|sure|diger", "yer": "..."}
\`\`\`

### Müvekkil Arama
Kullanıcı belirli bir müvekkili sorduğunda önce sistem verisinde bak, bulamazsan:
\`\`\`action:muvekkil_ara
{"isim": "..."}
\`\`\`

### Dilekçe Başlat
Kullanıcı dilekçe hazırlanmasını istediğinde:
\`\`\`action:dilekce_baslat
{"konu": "...", "tur": "ihtarname|sikayet|itiraz|is_tazminat|kira|tuketici|nafaka|diger"}
\`\`\`

## KESİN KURALLAR
1. Sistem verisindeki soruları (takvim, dava, müvekkil, ödeme) VERİYE DAYANARAK yanıtla — uydurma
2. Hukuki sorularda kaynak göster: kanun adı + madde, Yargıtay/Danıştay kararı esas+karar+tarih
3. Hak düşürücü süreler ve zamanaşımını her zaman vurgula — bu kritiktir
4. Dosya bağlamı varsa o dosyaya göre yanıt ver
5. Bilmediğini uydurma; "Bu bilgiyi sistemde bulamadım" de
6. İçtihat verirken hem destekleyen hem aykırı kararları belirt
7. Dilekçe/belge istenirse taslak hazırla
8. Aksiyon eklerken yanıtın geri kalanını da yaz — sadece JSON bırakma

## HUKUK BİLGİ BANKASI
### Usul
- HMK 6100 (yargılama, delil, ispat, kesin süre)
- CMK 5271 (ceza yargılaması, tutukluluk, kovuşturma)
- İYUK 2577 (idari yargı, 30/60 gün süre)
- İİK 2004 (icra, haciz, ihalenin feshi — 7 günlük şikâyet)

### Maddi Hukuk
- TMK 4721 (aile, miras, kişilik), TBK 6098 (sözleşme, kira, tazminat)
- TCK 5237 (suçlar), TTK 6102 (şirket, kıymetli evrak)
- İş K. 4857 (kıdem/ihbar hesabı, işe iade 1 aylık süre)
- TKHK 6502 (tüketici), KMK 634 (kat mülkiyeti)
- KVKK 6698, AY 1982

### Önemli Süreler (Ezberle)
- İş davası açma: fesihten itibaren 1 ay (işe iade), 5 yıl (alacaklar)
- Boşanmada mal tasfiyesi: 10 yıl
- İdari iptal davası: tebliğden 60 gün (Danıştay), 30 gün (idare mahkemesi)
- İcra şikayeti: 7 gün (öğrenmeden itibaren)
- Tüketici hakem: 2 yıl (faturadan)
- Genel zamanaşımı: TBK 146 → 10 yıl; haksız eylem → TBK 72 → 2/10 yıl
- Kira tahliye: 10 gün ihtarname + 30 gün + icra

## YANIT FORMATI
Kısa, pratik, teknik. Gereksiz nezaket cümlesi kullanma. Aksiyonlar için JSON bloğu ekle. Hukuki konularda başlık + madde + içtihat yapısını koru.`;
}

async function getBuroContext(userId: string, serviceSupabase: Any): Promise<string> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [clients, cases, events, pendingPayments, monthlyRevenue] = await Promise.all([
    serviceSupabase.from("clients").select("id, full_name, phone, email, tc_number")
      .eq("lawyer_id", userId).eq("is_active", true).order("full_name").limit(100),
    serviceSupabase.from("cases").select("id, title, status, case_number, court, opposing_party, created_at")
      .eq("lawyer_id", userId).in("status", ["aktif", "beklemede"]).order("created_at", { ascending: false }).limit(100),
    serviceSupabase.from("calendar_events").select("id, title, event_type, starts_at, location, notes")
      .eq("lawyer_id", userId).gte("starts_at", todayStart).lte("starts_at", weekLater)
      .order("starts_at", { ascending: true }).limit(20),
    serviceSupabase.from("payments").select("amount, description, created_at")
      .eq("user_id", userId).eq("status", "pending").limit(30),
    serviceSupabase.from("payments").select("amount")
      .eq("user_id", userId).eq("status", "success").gte("created_at", monthStart),
  ]);

  const totalRevenue = (monthlyRevenue.data as { amount: number }[] | null)
    ?.reduce((s: number, p: { amount: number }) => s + p.amount, 0) ?? 0;

  const lines: string[] = [
    `### BURO ÖZETİ`,
    `Aktif müvekkil: ${clients.data?.length ?? 0} | Aktif/bekleyen dava: ${cases.data?.length ?? 0} | Bu ay tahsilat: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalRevenue)}`,
    "",
  ];

  if (events.data?.length > 0) {
    lines.push("### SONRAKİ 7 GÜN TAKVİM");
    for (const ev of events.data as Any[]) {
      const dt = new Date(ev.starts_at);
      const label = dt.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })
        + " " + dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      lines.push(`• [${(ev.event_type as string).toUpperCase()}] ${ev.title} — ${label}${ev.location ? ` @ ${ev.location}` : ""}`);
    }
    lines.push("");
  } else {
    lines.push("### TAKVİM: Önümüzdeki 7 günde planlanmış etkinlik yok.");
    lines.push("");
  }

  if (clients.data?.length > 0) {
    lines.push("### MÜVEKKİLLER");
    for (const c of clients.data as Any[]) {
      lines.push(`• ${c.full_name}${c.tc_number ? ` (TC: ${c.tc_number})` : ""}${c.phone ? ` | Tel: ${c.phone}` : ""}${c.email ? ` | E: ${c.email}` : ""}`);
    }
    lines.push("");
  }

  if (cases.data?.length > 0) {
    lines.push("### DAVALAR");
    for (const c of cases.data as Any[]) {
      lines.push(`• [${(c.status as string).toUpperCase()}] ${c.title}${c.case_number ? ` | No: ${c.case_number}` : ""}${c.court ? ` | ${c.court}` : ""}${c.opposing_party ? ` | Karşı: ${c.opposing_party}` : ""}`);
    }
    lines.push("");
  }

  if (pendingPayments.data?.length > 0) {
    lines.push("### BEKLEYEN ÖDEMELER");
    for (const p of pendingPayments.data as Any[]) {
      lines.push(`• ${p.description ?? "Ödeme"}: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.amount)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = createServiceClient() as Any;

    const body = await request.json() as {
      message: string;
      sessionId?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!body.message?.trim()) return Response.json({ error: "Mesaj boş olamaz" }, { status: 400 });

    // Profil
    const { data: profile } = await serviceSupabase
      .from("profiles").select("full_name, user_type").eq("id", user.id).single();

    if (!profile || profile.user_type !== "avukat") {
      return Response.json({ error: "Bu özellik sadece avukatlara açıktır" }, { status: 403 });
    }

    // Session oluştur veya bul
    let activeSessionId = body.sessionId;
    if (!activeSessionId) {
      const { data: session } = await serviceSupabase
        .from("sessions")
        .insert({ user_id: user.id, title: body.message.slice(0, 80) })
        .select("id").single();
      activeSessionId = session?.id;
    }

    // Kullanıcı mesajını kaydet
    if (activeSessionId) {
      await serviceSupabase.from("messages").insert({
        session_id: activeSessionId,
        user_id: user.id,
        role: "user",
        content: body.message,
      }).then(() => {}).catch(() => {});
    }

    // Canlı bağlam çek
    const contextData = await getBuroContext(user.id, serviceSupabase);
    const systemPrompt = buildSystemPrompt(profile.full_name as string, contextData);

    // Sohbet geçmişini oluştur
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (body.history && body.history.length > 0) {
      // Son 10 mesajı al (token tasarrufu)
      const recent = body.history.slice(-10);
      conversationHistory.push(...recent);
    }

    // Mevcut mesajı ekle
    conversationHistory.push({ role: "user", content: body.message });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // İlk chunk: sessionId gönder
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ sessionId: activeSessionId })}\n\n`)
          );

          const claudeStream = await anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 3000,
            system: systemPrompt,
            messages: conversationHistory,
          });

          for await (const chunk of claudeStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`)
              );
            }
          }

          // Aksiyonları parse et
          const actions = parseActions(fullResponse);

          // Aksiyonları işle
          for (const action of actions) {
            await processAction(action, user.id, serviceSupabase);
          }

          // Asistan yanıtını kaydet
          if (activeSessionId) {
            await serviceSupabase.from("messages").insert({
              session_id: activeSessionId,
              user_id: user.id,
              role: "assistant",
              content: fullResponse,
            }).then(() => {}).catch(() => {});

            await serviceSupabase.from("sessions")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", activeSessionId)
              .then(() => {}).catch(() => {});
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, actions })}\n\n`)
          );
          controller.close();
        } catch (err) {
          console.error("MizanAI stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "AI yanıt üretirken hata oluştu" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("MizanAI error:", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

interface Action {
  type: "takvim" | "muvekkil_ara" | "dilekce_baslat";
  data: Record<string, string>;
}

function parseActions(text: string): Action[] {
  const actions: Action[] = [];
  const regex = /```action:(\w+)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const type = match[1] as Action["type"];
      const data = JSON.parse(match[2]) as Record<string, string>;
      actions.push({ type, data });
    } catch { /* malformed JSON */ }
  }
  return actions;
}

async function processAction(action: Action, userId: string, svc: Any): Promise<void> {
  if (action.type === "takvim") {
    const { baslik, tarih, saat, tur, yer } = action.data;
    if (!baslik || !tarih) return;
    const startsAt = saat ? `${tarih}T${saat}:00` : `${tarih}T09:00:00`;
    await svc.from("calendar_events").insert({
      lawyer_id: userId,
      title: baslik,
      event_type: tur ?? "diger",
      starts_at: startsAt,
      location: yer ?? null,
    }).then(() => {}).catch(() => {});
  }
}
