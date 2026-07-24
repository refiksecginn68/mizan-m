import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkAndConsumeQuota, refundQuota, QUOTA_EXHAUSTED_BODY } from "@/lib/quota";
import { dilekceMetniTemizle } from "@/lib/services/dilekce-temizle";
import { fetchRAGContext, buildContextString } from "@/lib/ai/rag";
import { ornekDilekceAra, ornekBaglamiKur } from "@/lib/ai/dilekce-rag";
import { sablonBul } from "@/lib/data/dilekce-sablonlari";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const serviceSupabase = createServiceClient() as Any;
  const hasQuota = await checkAndConsumeQuota(user.id);
  if (!hasQuota) {
    return Response.json(QUOTA_EXHAUSTED_BODY, { status: 402 });
  }

  const body = await request.json() as {
    konu: string;
    tur?: string;
    /** "Bahsetme/açıklama" alanı — AI'a TALİMATTIR, dilekçe metnine kopyalanmaz */
    ekBilgi?: string;
    dosyaMetni?: string;
    mod: "ai" | "duzenle";
    mevcutMetin?: string;
    /** Şablondan-üretim: seçilen örnek şablonun id'si */
    sablonId?: string;
    /** Soru-sor akışında verilen yanıtlar */
    sohbet?: { soru: string; cevap: string }[];
    /** Çıktı uzunluğu — varsayılan "standart" (kısa dilekçe disiplini) */
    uzunluk?: "kisa" | "standart" | "detayli";
    /** Avukatın üretimden önce onayladığı/düzelttiği özet — esas alınır */
    ozet?: string;
  };

  if (!body.konu?.trim()) {
    await refundQuota(user.id);
    return Response.json({ error: "Dilekçe konusu gereklidir" }, { status: 400 });
  }

  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const avukatAd = profile?.full_name ?? "Avukat";
  const turBilgi = body.tur ? `\nDilekçe türü: ${body.tur}` : "";

  const uzunluk = body.uzunluk ?? "standart";
  const uzunlukTalimati = {
    kisa:
      "Bu dilekçe KISA olsun: yaklaşık 150-350 kelime. Yalnızca çekirdek vakıalar ve net talep. " +
      "Açıklamalar bölümü en çok 2-3 kısa numaralı paragraf.",
    standart:
      "Bu dilekçe STANDART uzunlukta olsun: yaklaşık 400-700 kelime, 1-2 sayfa. Basit taleplerde daha da kısa tut — " +
      "kelime hedefini doldurmak için metni ŞİŞİRME. Açıklamalar bölümü konuya yeten sayıda numaralı paragraf.",
    detayli:
      "Bu dilekçe DETAYLI olsun: yaklaşık 700-1400 kelime. Vakıaları ve hukuki gerekçeyi daha ayrıntılı işle; " +
      "yine de dolgu paragraf, tekrar ve genel hukuk anlatımı YASAK.",
  }[uzunluk];
  const maxTokens = { kisa: 1500, standart: 2600, detayli: 5000 }[uzunluk];

  const systemPrompt = `Sen 30 yıllık deneyime sahip, alanında uzman bir dilekçe yazarı avukatsın.
Meslektaşın olan Av. ${avukatAd} için profesyonel hukuki belgeler hazırlıyorsun.

UZUNLUK VE ÖZ DİSİPLİNİ (EN ÖNEMLİ KURAL):
- ${uzunlukTalimati}
- Az bilgi verildiğinde metni UZATMA. Eksik bilgiyi genel geçer hukuk cümleleriyle DOLDURMA — [YER TUTUCU] bırak.
- DOLGU YASAĞI: gereksiz giriş/kapanış cümleleri, aynı fikrin tekrarı, "işbu dilekçe ile arz ederiz ki..." türü şişirme YOK.
- GENEL HUKUK DERSİ YASAK: "Türk hukukunda tazminat şöyledir...", "Bilindiği üzere..." gibi soyut/ansiklopedik paragraflar YAZMA. Yalnızca somut olaya bağlı, ispata dönük cümleler kur.
- Kanun maddesi atfı YERİNDE ve AZ olsun; olayla ilgisi olmayan madde sıralaması yapma.

ÜSLUP — "30 yıllık avukat yazmış" gibi:
- Somut, mesafeli, teknik dil. Duygusal/anlatısal ifade YOK ("mağdur olmuş", "büyük üzüntü duymuştur", "çaresiz kalmıştır" gibi).
- Dilekçe bir dert anlatma metni değildir: vakıalar sıra numarasıyla, kısa ve ispata dönük yazılır (HMK m.119/1-e somutlaştırma yükü).
- Standart usul kalıplarını doğru ve yalın kullan (makam hitabı, "SONUÇ VE İSTEM" bölümü, saygı ifadesi tek satır).

KURALLAR:
- Türk hukuku ve usulüne tam uygunluk; USUL ve ESAS ayrımını gözet (usuli itirazlar önce, esasa ilişkin savunma/talep sonra)
- Doğru ve tam mahkeme hitabı (ör. "İSTANBUL ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE"); görevli/yetkili mahkemeyi konuya göre doğru seç
- İlgili kanun maddelerine açık atıf (kanun adı + madde no); biliniyorsa yerleşik Yargıtay içtihadına atıf
- Kusursuz, resmi Türkçe hukuk dili; devrik/konuşma dili yok
- Zorunlu bölümler: başlık/makam, taraflar (ad-soyad, T.C., adres alanları), vekil bilgisi, konu, açıklamalar (numaralı), hukuki nedenler, hukuki deliller, sonuç ve istem (net taleplerle), tarih + Av. imza bloğu
- Belge yüklenmişse: içeriğini dikkatle analiz et, olay örgüsünü ve iddiaları belgeden çıkar, dilekçeyi bu somut olaya dayandır — genel geçer metin yazma
- Bilinmeyen bilgiler için [KÖŞELİ PARANTEZ] yer tutucu kullan
- Sadece dilekçe metnini üret, ek açıklama ekleme

GİRDİ AYRIMI (ÇOK ÖNEMLİ):
- Sana verilen "AVUKATIN TALİMATI", "ÖN GÖRÜŞME" ve "ÜSLUP VE YAPI REFERANSI" bölümleri
  SANA YÖNELİK BAĞLAMDIR — bunlar dilekçenin İÇİNE yazılmaz.
- Bu bölümlerdeki cümleleri dilekçe metnine OLDUĞU GİBİ KOPYALAMA. Onlardan çıkardığın
  BİLGİYİ kendi hukuki dilinle dilekçeye işle.
- Dilekçe metninde "talimat", "not", "ön görüşme", "örnek" gibi başlıklar veya bu bölümlere
  yapılan atıflar ASLA yer almaz. Çıktı, doğrudan mahkemeye sunulacak temiz bir dilekçedir.

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

  // ── Bağlam toplama ───────────────────────────────────────────────
  const aramaSorgusu = [body.konu, body.tur, body.ekBilgi].filter(Boolean).join(" ").slice(0, 500);

  const secilenSablon = body.sablonId ? sablonBul(body.sablonId) : undefined;

  // Şablondan-üretim: seçilen şablon iskelet olur.
  // Değilse örnek korpusundan üslup/yapı referansı çekilir.
  let ornekBaglam = "";
  if (secilenSablon) {
    ornekBaglam =
      `\n\n## TEMEL ALINACAK ŞABLON: ${secilenSablon.baslik}\n` +
      `(${secilenSablon.dilekceTipi} · ${secilenSablon.yetkiliMahkeme} · ${secilenSablon.davaTuru})\n\n` +
      secilenSablon.icerik +
      `\n\nBu şablonun BÖLÜM YAPISINI ve ÜSLUBUNU temel al. Yer tutucuları ve genel ifadeleri, ` +
      `kullanıcının anlattığı SOMUT OLAYA göre doldur ve zenginleştir. Olayla ilgisi olmayan ` +
      `bölümleri çıkar, gereken bölümleri ekle. Şablonu körü körüne kopyalama — konuya uyarla.`;
  }

  // İçtihat/mevzuat (hukuki dayanak) + örnek dilekçe (üslup/yapı) — iki ayrı katman
  const [ragCtx, ornekler] = await Promise.all([
    fetchRAGContext(aramaSorgusu, "dilekce").catch(() => ({ chunks: [], sources: [] })),
    secilenSablon
      ? Promise.resolve([])
      : ornekDilekceAra(aramaSorgusu, { limit: 4 }).catch(() => []),
  ]);

  if (!secilenSablon && ornekler.length) ornekBaglam = ornekBaglamiKur(ornekler);
  const hukukiBaglam = buildContextString(ragCtx);

  // Ön görüşme yanıtları — bilgi kaynağıdır, metne kopyalanmaz
  const sohbetBaglam = body.sohbet?.length
    ? "\n\n## ÖN GÖRÜŞME (avukatın müvekkilden aldığı yanıtlar)\n" +
      body.sohbet.map((s) => `Soru: ${s.soru}\nYanıt: ${s.cevap}`).join("\n") +
      "\n\nBu yanıtlardaki BİLGİYİ dilekçeye işle; soru-cevap biçimini metne taşıma."
    : "";

  // "Bahsetme/açıklama" alanı — talimat olarak çerçevelenir, içerik olarak değil
  const talimatBaglam = body.ekBilgi?.trim()
    ? "\n\n## AVUKATIN TALİMATI (dilekçeye kopyalanmaz, yalnızca sana yön verir)\n" +
      body.ekBilgi.trim()
    : "";

  // Avukatın onayladığı özet — doğrulanmış bilgi kaynağıdır, dilekçenin çekirdeğini oluşturur
  const ozetBaglam = body.ozet?.trim()
    ? "\n\n## AVUKATIN ONAYLADIĞI ÖZET (doğrulanmış — dilekçenin çekirdeği bu bilgilerdir)\n" +
      body.ozet.trim() +
      "\n\nBu özetteki bilgileri esas al; özet dışındaki eksik noktaları [YER TUTUCU] bırak, uydurma."
    : "";

  const userMessage = body.mod === "duzenle" && body.mevcutMetin
    ? `Aşağıdaki dilekçeyi şu yönde düzenle/iyileştir:\n\nYeni konu/talimat: ${body.konu}` +
      `${talimatBaglam}${hukukiBaglam}\n\nMevcut dilekçe:\n${body.mevcutMetin}`
    : `Konu: ${body.konu}${turBilgi}` +
      `${talimatBaglam}` +
      `${ozetBaglam}` +
      `${sohbetBaglam}` +
      `${body.dosyaMetni ? `\n\n## YÜKLENEN BELGELERDEN ÇIKARILAN METİN\n${body.dosyaMetni.slice(0, 40000)}` : ""}` +
      `${ornekBaglam}` +
      `${hukukiBaglam}` +
      `\n\nBu konuda profesyonel bir dilekçe hazırla.`;

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const delta = event.delta.text;
            fullText += delta;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }
        }

        // Markdown sembolleri parçalar arasına bölünebildiği için temizlik akış
        // sonunda tam metin üzerinde yapılır; istemci içeriği bununla değiştirir.
        const temiz = dilekceMetniTemizle(fullText);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            done: true,
            metin: temiz,
            kaynaklar: ragCtx.sources.slice(0, 8),
            ornekler: ornekler.map((o) => ({ id: o.sablonId, baslik: o.baslik })),
          })}\n\n`)
        );
        controller.close();

        serviceSupabase.from("generated_documents").insert({
          user_id: user.id,
          title: body.konu.trim().split("\n")[0].slice(0, 100),
          document_type: "avukat_dilekce",
          content: temiz,
        }).then(() => {}).catch(() => {});
      } catch (err) {
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
