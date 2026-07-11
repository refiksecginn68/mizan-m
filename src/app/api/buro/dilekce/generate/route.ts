import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkAndConsumeQuota, refundQuota, QUOTA_EXHAUSTED_BODY } from "@/lib/quota";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Sorgu kotası harcaması (AI çağrısı = 1 kota)
  const serviceSupabase = createServiceClient() as Any;
  const hasQuota = await checkAndConsumeQuota(user.id);
  if (!hasQuota) {
    return Response.json(QUOTA_EXHAUSTED_BODY, { status: 402 });
  }

  const body = await request.json() as {
    konu: string;
    tur?: string;
    ekBilgi?: string;
    dosyaMetni?: string;
    mod: "ai" | "duzenle";
    mevcutMetin?: string;
  };

  if (!body.konu?.trim()) {
    return Response.json({ error: "Dilekçe konusu gereklidir" }, { status: 400 });
  }

  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const avukatAd = profile?.full_name ?? "Avukat";
  const turBilgi = body.tur ? `\nDilekçe türü: ${body.tur}` : "";

  const systemPrompt = `Sen 30 yıllık deneyime sahip, alanında uzman bir dilekçe yazarı avukatsın.
Meslektaşın olan Av. ${avukatAd} için profesyonel hukuki belgeler hazırlıyorsun.

KURALLAR:
- Türk hukuku ve usulüne tam uygunluk; USUL ve ESAS ayrımını gözet (usuli itirazlar önce, esasa ilişkin savunma/talep sonra)
- Doğru ve tam mahkeme hitabı (ör. "İSTANBUL ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE"); görevli/yetkili mahkemeyi konuya göre doğru seç
- İlgili kanun maddelerine açık atıf (kanun adı + madde no); biliniyorsa yerleşik Yargıtay içtihadına atıf
- Kusursuz, resmi Türkçe hukuk dili; devrik/konuşma dili yok
- Zorunlu bölümler: başlık/makam, taraflar (ad-soyad, T.C., adres alanları), vekil bilgisi, konu, açıklamalar (numaralı), hukuki nedenler, hukuki deliller, sonuç ve istem (net taleplerle), tarih + Av. imza bloğu
- Belge yüklenmişse: içeriğini dikkatle analiz et, olay örgüsünü ve iddiaları belgeden çıkar, dilekçeyi bu somut olaya dayandır — genel geçer metin yazma
- Bilinmeyen bilgiler için [KÖŞELİ PARANTEZ] yer tutucu kullan
- Sadece dilekçe metnini üret, ek açıklama ekleme

BİÇİM (KESİN):
- Markdown KULLANMA: #, ##, *, **, -, \`\`\`, > gibi işaretler YASAK. Çıktı, kağıda basılacak gerçek bir dilekçe metnidir; markdown işaretleri metinde aynen görünür ve belgeyi bozar.
- Vurgu gerekiyorsa BÜYÜK HARF kullan (başlık ve bölüm adlarında); yıldız/kalın işareti asla kullanma.
- Kurumsal dilekçe düzeni şablonu:

[İL] ( ). [GÖREVLİ] MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI             : [AD SOYAD] (T.C.: [T.C. NO])
                     [ADRES]
VEKİLİ             : Av. ${avukatAd}
DAVALI             : [AD SOYAD/UNVAN]
                     [ADRES]
KONU               : [Talebin bir cümlelik özeti]
DAVA DEĞERİ        : [TUTAR] TL (gerekiyorsa)

AÇIKLAMALAR

1. [Numaralı paragraflar halinde olaylar ve iddialar]

2. [...]

HUKUKİ NEDENLER    : [Kanun adı ve madde numaraları]

HUKUKİ DELİLLER    : [Deliller listesi]

SONUÇ VE İSTEM     : [Net talepler]

                                                    [TARİH]
                                                    Davacı Vekili
                                                    Av. ${avukatAd}
- Bölüm başlıkları (AÇIKLAMALAR, HUKUKİ NEDENLER vb.) düz büyük harfle yazılır, önlerinde işaret olmaz.`;

  const userMessage = body.mod === "duzenle" && body.mevcutMetin
    ? `Aşağıdaki dilekçeyi şu yönde düzenle/iyileştir:\n\nYeni konu/talimat: ${body.konu}\n\nMevcut dilekçe:\n${body.mevcutMetin}`
    : `Konu: ${body.konu}${turBilgi}${body.ekBilgi ? `\n\nEk bilgi:\n${body.ekBilgi}` : ""}${body.dosyaMetni ? `\n\nYüklenen belgeden çıkarılan metin:\n${body.dosyaMetni.slice(0, 20000)}` : ""}\n\nBu konuda profesyonel bir dilekçe hazırla.`;

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const delta = event.delta.text;
            fullText += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();

        // DB kayıt (fire and forget)
        serviceSupabase.from("generated_documents").insert({
          user_id: user.id,
          title: body.konu.slice(0, 100),
          document_type: "avukat_dilekce",
          content: fullText,
        }).then(() => {}).catch(() => {});
      } catch (err) {
        // Başarısız çağrı kotadan yemez
        await refundQuota(user.id);
        const msg = err instanceof Error ? err.message : "Hata";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
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
}
