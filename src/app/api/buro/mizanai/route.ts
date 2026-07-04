import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Tool tanımları ────────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_calendar_event",
    description: "Avukatın takvimine yeni etkinlik, duruşma veya randevu ekler. Kullanıcı 'takvime ekle', 'kaydet', 'randevu oluştur', 'duruşma yaz' dediğinde çağır.",
    input_schema: {
      type: "object" as const,
      properties: {
        baslik: { type: "string", description: "Etkinlik başlığı" },
        tarih: { type: "string", description: "Tarih YYYY-MM-DD formatında" },
        saat: { type: "string", description: "Saat HH:MM formatında (opsiyonel, varsayılan 09:00)" },
        tur: { type: "string", enum: ["durusma", "toplanti", "sure", "tebligat", "diger"], description: "Etkinlik türü" },
        yer: { type: "string", description: "Yer/mahkeme/konum (opsiyonel)" },
        notlar: { type: "string", description: "Ek notlar (opsiyonel)" },
      },
      required: ["baslik", "tarih"],
    },
  },
  {
    name: "get_case_details",
    description: "Belirli bir davanın tüm detaylarını getirir: taraflar, duruşmalar, belgeler, notlar. Bir dava hakkında sorulduğunda kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        case_id: { type: "string", description: "Dava ID'si (biliniyorsa)" },
        case_title_or_number: { type: "string", description: "Dava başlığı veya esas numarası (ID bilinmiyorsa)" },
      },
      required: [],
    },
  },
  {
    name: "search_emsal",
    description: "Türkiye hukuku emsal kararları ve içtihat arar. Yargıtay, Danıştay veya AYM kararı sorulduğunda kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Arama terimi — konu, kanun maddesi veya hukuki mesele" },
        mahkeme: { type: "string", enum: ["yargitay", "danistay", "anayasa", "all"], description: "Mahkeme filtresi" },
      },
      required: ["query"],
    },
  },
  {
    name: "start_dilekce",
    description: "Dilekçe hazırlama sayfasına yönlendirme URL'si oluşturur. Kullanıcı dilekçe yazmak/hazırlamak istediğinde kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        konu: { type: "string", description: "Dilekçe konusu" },
        tur: { type: "string", enum: ["ihtarname", "sikayet", "itiraz", "is_tazminat", "kira", "tuketici", "nafaka", "diger"] },
        case_id: { type: "string", description: "İlgili dava ID'si (opsiyonel)" },
      },
      required: ["konu"],
    },
  },
  {
    name: "get_client_info",
    description: "Belirli bir müvekkil hakkında bilgi getirir: iletişim, vekalet, davalar. Müvekkil hakkında sorulduğunda kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        name_or_tc: { type: "string", description: "Müvekkil adı veya TC kimlik numarası" },
      },
      required: ["name_or_tc"],
    },
  },
];

// ── Büro bağlamı ──────────────────────────────────────────────────────────────

async function getBuroContext(userId: string, svc: Any): Promise<string> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [clients, cases, events, pendingPayments, monthlyRevenue] = await Promise.all([
    svc.from("clients").select("id, full_name, phone, email, tc_no").eq("lawyer_id", userId).eq("is_active", true).order("full_name").limit(100),
    svc.from("cases").select("id, title, status, case_number, court, opposing_party, created_at").eq("lawyer_id", userId).in("status", ["aktif", "beklemede"]).order("created_at", { ascending: false }).limit(100),
    svc.from("calendar_events").select("id, title, event_type, starts_at, location").eq("lawyer_id", userId).gte("starts_at", todayStart).lte("starts_at", weekLater).order("starts_at", { ascending: true }).limit(20),
    svc.from("payments").select("amount, description").eq("user_id", userId).eq("status", "pending").limit(30),
    svc.from("payments").select("amount").eq("user_id", userId).eq("status", "success").gte("created_at", monthStart),
  ]);

  const totalRevenue = (monthlyRevenue.data as { amount: number }[] | null)?.reduce((s, p) => s + p.amount, 0) ?? 0;

  const lines: string[] = [
    `### BÜRO ÖZETİ`,
    `Aktif müvekkil: ${clients.data?.length ?? 0} | Aktif/bekleyen dava: ${cases.data?.length ?? 0} | Bu ay tahsilat: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalRevenue)}`,
    "",
  ];

  if ((events.data as Any[])?.length > 0) {
    lines.push("### SONRAKİ 7 GÜN TAKVİM");
    for (const ev of events.data as Any[]) {
      const dt = new Date(ev.starts_at as string);
      lines.push(`• [${ev.event_type}] ${ev.title} — ${dt.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} ${dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}${ev.location ? ` @ ${ev.location}` : ""}`);
    }
    lines.push("");
  }

  if ((clients.data as Any[])?.length > 0) {
    lines.push("### MÜVEKKİLLER");
    for (const c of clients.data as Any[]) {
      lines.push(`• [id:${c.id}] ${c.full_name}${c.tc_no ? ` (TC:${c.tc_no})` : ""}${c.phone ? ` | Tel:${c.phone}` : ""}${c.email ? ` | E:${c.email}` : ""}`);
    }
    lines.push("");
  }

  if ((cases.data as Any[])?.length > 0) {
    lines.push("### DAVALAR");
    for (const c of cases.data as Any[]) {
      lines.push(`• [id:${c.id}] [${c.status}] ${c.title}${c.case_number ? ` | Esas:${c.case_number}` : ""}${c.court ? ` | ${c.court}` : ""}${c.opposing_party ? ` | Karşı:${c.opposing_party}` : ""}`);
    }
    lines.push("");
  }

  if ((pendingPayments.data as Any[])?.length > 0) {
    lines.push("### BEKLEYEN ÖDEMELER");
    for (const p of pendingPayments.data as Any[]) {
      lines.push(`• ${p.description ?? "Ödeme"}: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.amount)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(lawyerName: string, contextData: string): string {
  const now = new Date();
  const tarih = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const saat = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return `Sen Mizanım platformunun MizanAI asistanısın. Av. ${lawyerName}'in kişisel hukuki büro asistanısın.
Bugün: ${tarih} — Saat: ${saat}

## KİMLİĞİN
Deneyimli bir hukukçu asistanısın — teknik, doğrudan, verimlilik odaklı. Türkiye hukukunu (TMK, TBK, TCK, HMK, İİK, İş Kanunu vb.) ve Yargıtay/Danıştay/AYM içtihadını çok iyi biliyorsun. Büronun günlük işleyişine tam hâkimsin.

## CANLI BÜRO VERİSİ (şu an geçerlidir)
${contextData}

## ARAÇLARIN (Tools)
Şu araçlara erişimin var — gerektiğinde kullan:
- **create_calendar_event**: Takvime etkinlik/duruşma/randevu ekler
- **get_case_details**: Dava detayları (duruşmalar, belgeler, notlar)
- **search_emsal**: Emsal karar ve içtihat arama
- **start_dilekce**: Dilekçe hazırlama sayfası URL'si
- **get_client_info**: Müvekkil bilgileri

## KESİN KURALLAR
1. Büro verisi sorularında (takvim, dava, müvekkil, ödeme) veriye bak — kesinlikle uydurma
2. Hukuki sorularda: tam kanun/madde/fıkra/bent + Yargıtay/Danıştay/AYM kararı esas+karar+tarih
3. Hem destekleyen hem aykırı içtihadı göster
4. Hak düşürücü süreler ve zamanaşımını HER ZAMAN vurgula — hayati önem taşır
5. Bilmediğini söyle — "Güncel içtihat için Lexpera/Kazancı'ya bakın" de
6. HUMK dönemindeki kararları HMK ile karşılaştır
7. Dilekçe/belge istenirse start_dilekce aracını kullan, ardından kısa taslak sun
8. Yanıt formatı: Kısa başlık → madde/içtihat → prosedürel notlar → strateji. Gereksiz nezaket yok.

## TEMEL MEVZUAT
**Usul:** HMK 6100, CMK 5271, İYUK 2577, İİK 2004
**Maddi:** TMK 4721, TBK 6098, TCK 5237, TTK 6102, İş K. 4857, TKHK 6502, KMK 634, KVKK 6698
**Süreler:** İşe iade 1 ay | İş alacakları 5 yıl | İdari dava 60/30 gün | İcra şikayeti 7 gün | Tüketici hakem 2 yıl | Genel TBK m.146 10 yıl | Haksız eylem TBK m.72 2/10 yıl`;
}

// ── Tool execution ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, string>,
  userId: string,
  svc: Any
): Promise<string> {
  try {
    if (name === "create_calendar_event") {
      const { baslik, tarih, saat, tur, yer, notlar } = input;
      if (!baslik || !tarih) return "Hata: başlık ve tarih zorunludur.";
      const startsAt = saat ? `${tarih}T${saat}:00` : `${tarih}T09:00:00`;
      const { error } = await svc.from("calendar_events").insert({
        lawyer_id: userId,
        title: baslik,
        event_type: tur ?? "diger",
        starts_at: startsAt,
        ends_at: (() => { const d = new Date(startsAt); d.setHours(d.getHours() + 1); return d.toISOString(); })(),
        location: yer ?? null,
        description: notlar ?? null,
      });
      if (error) return `Hata: ${error.message}`;
      return `✅ Takvime eklendi: "${baslik}" — ${tarih} ${saat ?? "09:00"}${yer ? ` @ ${yer}` : ""}`;
    }

    if (name === "get_case_details") {
      const { case_id, case_title_or_number } = input;
      let query = svc.from("cases").select("*, clients(full_name, phone, email)").eq("lawyer_id", userId);
      if (case_id) query = query.eq("id", case_id);
      else if (case_title_or_number) {
        query = query.or(`title.ilike.%${case_title_or_number}%,case_number.ilike.%${case_title_or_number}%`);
      }
      const { data, error } = await query.limit(3);
      if (error || !data?.length) return "Bu dava sistemde bulunamadı.";
      return JSON.stringify(data, null, 2);
    }

    if (name === "search_emsal") {
      const { query, mahkeme } = input;
      const qs = new URLSearchParams({ q: query });
      if (mahkeme && mahkeme !== "all") qs.set("mahkeme", mahkeme);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/emsal/search?${qs}`, {
          signal: AbortSignal.timeout(8000),
        });
        const json = await res.json() as { results?: Any[] };
        const results = json.results?.slice(0, 5) ?? [];
        if (!results.length) return "Bu konuda emsal karar bulunamadı.";
        return results.map((r: Any) =>
          `• ${r.mahkeme ?? ""} ${r.esasNo ?? ""} ${r.kararNo ?? ""} (${r.tarih ?? ""}) — ${r.ozet ?? r.konu ?? ""}`.trim()
        ).join("\n");
      } catch {
        return "Emsal arama geçici olarak kullanılamıyor. Lexpera veya Kazancı'yı deneyebilirsiniz.";
      }
    }

    if (name === "start_dilekce") {
      const { konu, tur, case_id } = input;
      const params = new URLSearchParams({ konu });
      if (tur) params.set("tur", tur);
      if (case_id) params.set("caseId", case_id);
      return `Dilekçe sayfası: /buro/dilekce?${params.toString()} — Bu linke yönlendir veya dilekçe taslağı için bekle.`;
    }

    if (name === "get_client_info") {
      const { name_or_tc } = input;
      const { data, error } = await svc
        .from("clients")
        .select("*, cases(id, title, case_number, status)")
        .eq("lawyer_id", userId)
        .or(`full_name.ilike.%${name_or_tc}%,tc_no.eq.${name_or_tc}`)
        .limit(3);
      if (error || !data?.length) return "Bu müvekkil sistemde bulunamadı.";
      return JSON.stringify(data, null, 2);
    }

    return "Bilinmeyen araç.";
  } catch {
    return "Araç çalıştırılırken hata oluştu.";
  }
}

// ── Ana handler ───────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const svc = createServiceClient() as Any;

    const body = await request.json() as {
      message: string;
      sessionId?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!body.message?.trim()) return Response.json({ error: "Mesaj boş olamaz" }, { status: 400 });

    const { data: profile } = await svc.from("profiles").select("full_name, user_type").eq("id", user.id).single();
    if (!profile || profile.user_type !== "avukat") {
      return Response.json({ error: "Bu özellik sadece avukatlara açıktır" }, { status: 403 });
    }

    let activeSessionId = body.sessionId;
    if (!activeSessionId) {
      const { data: session } = await svc.from("sessions").insert({ user_id: user.id, title: body.message.slice(0, 80) }).select("id").single();
      activeSessionId = session?.id as string | undefined;
    }

    if (activeSessionId) {
      await svc.from("messages").insert({ session_id: activeSessionId, user_id: user.id, role: "user", content: body.message }).then(() => {}).catch(() => {});
    }

    const contextData = await getBuroContext(user.id, svc);
    const systemPrompt = buildSystemPrompt(profile.full_name as string, contextData);

    // Sohbet geçmişi
    const history: Array<{ role: "user" | "assistant"; content: string }> = (body.history ?? []).slice(-10);
    const currentMessages: Anthropic.MessageParam[] = [
      ...history,
      { role: "user", content: body.message },
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          send({ sessionId: activeSessionId });

          // ── Geçiş 1: tool_use kontrolü ──────────────────────────────────
          const pass1 = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: systemPrompt,
            tools: TOOLS,
            messages: currentMessages,
          });

          const messagesForPass2: Anthropic.MessageParam[] = [...currentMessages];
          const completedActions: Array<{ tool: string; result: string }> = [];

          if (pass1.stop_reason === "tool_use") {
            // Asistan tool_use mesajını ekle
            messagesForPass2.push({ role: "assistant", content: pass1.content });

            // Tool sonuçlarını çalıştır
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const block of pass1.content) {
              if (block.type !== "tool_use") continue;
              send({ status: "tool_calling", tool: block.name });
              const result = await executeTool(block.name, block.input as Record<string, string>, user.id, svc);
              toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
              completedActions.push({ tool: block.name, result });
            }

            messagesForPass2.push({ role: "user", content: toolResults });
          } else {
            // Tool yoksa pass1 yanıtını direkt stream et
            for (const block of pass1.content) {
              if (block.type === "text") {
                // Metni parçalara bölerek stream et
                const words = block.text.split(" ");
                for (const word of words) {
                  send({ delta: word + " " });
                }
                const fullResponse = block.text;
                if (activeSessionId) {
                  await svc.from("messages").insert({ session_id: activeSessionId, user_id: user.id, role: "assistant", content: fullResponse }).then(() => {}).catch(() => {});
                }
              }
            }
            send({ done: true, actions: [] });
            controller.close();
            return;
          }

          // ── Geçiş 2: Tool sonuçlarıyla streaming yanıt ────────────────
          let fullResponse = "";
          const claudeStream = await anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 3000,
            system: systemPrompt,
            messages: messagesForPass2,
          });

          for await (const chunk of claudeStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              fullResponse += chunk.delta.text;
              send({ delta: chunk.delta.text });
            }
          }

          if (activeSessionId) {
            await svc.from("messages").insert({ session_id: activeSessionId, user_id: user.id, role: "assistant", content: fullResponse }).then(() => {}).catch(() => {});
          }

          // dilekce_baslat aksiyonunu UI'ya bildir
          const dilekceAction = completedActions.find((a) => a.tool === "start_dilekce");
          const calendarAction = completedActions.find((a) => a.tool === "create_calendar_event");

          const uiActions = [];
          if (dilekceAction) {
            const url = dilekceAction.result.match(/\/buro\/dilekce\?[^\s]*/)?.[0];
            if (url) uiActions.push({ type: "dilekce_baslat", url });
          }
          if (calendarAction) {
            uiActions.push({ type: "takvim_eklendi", mesaj: calendarAction.result });
          }

          send({ done: true, actions: uiActions });
          controller.close();
        } catch (err) {
          console.error("MizanAI stream error:", err);
          send({ error: "AI yanıt üretirken hata oluştu" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err) {
    console.error("MizanAI error:", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
