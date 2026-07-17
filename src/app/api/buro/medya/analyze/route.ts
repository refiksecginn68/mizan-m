import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkAndConsumeQuota, refundQuota, QUOTA_EXHAUSTED_BODY } from "@/lib/quota";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";
import { MIZAN_ORTAK_KURALLAR } from "@/lib/ai/prompts";
import { aiCiktiTemizle } from "@/lib/ai/ai-cikti";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Uzman-gözü değerlendirme çerçevesi: her analiz avukat, hâkim, savcı ve
// bilirkişi perspektifinden delil niteliği + çelişki/tutarlılık içerir.
const UZMAN_CERCEVE = `
Analizi DÖRT uzman perspektifiyle yap; her başlığı MUTLAKA yaz (delil değeri düşükse veya perspektif uygulanamıyorsa o başlıkta bunu bir-iki cümleyle gerekçelendir, başlığı atlama):
- AVUKAT GÖZÜYLE: Bu delil müvekkil lehine/aleyhine nasıl kullanılır? Hangi iddiayı destekler veya çürütür?
- HÂKİM GÖZÜYLE: Delilin ispat gücü, hükme esas alınabilirliği; HMK/CMK delil değerlendirme ölçütleri.
- SAVCI GÖZÜYLE: Suç unsuru barındırıyor mu; soruşturmada hangi yönde kullanılır?
- BİLİRKİŞİ GÖZÜYLE: Teknik bütünlük, manipülasyon/montaj şüphesi, metadata tutarlılığı, orijinallik göstergeleri.

Ayrıca mutlaka değerlendir:
- DELİL NİTELİĞİ: Hukuka uygun elde edilmiş mi olabilir (özel hayat, gizli kayıt, KVKK)? Kesin delil mi takdiri delil mi?
- ÇELİŞKİ/TUTARLILIK: İçerikte kendi içinde veya bilinen olgularla çelişen unsurlar var mı? Tarih/saat/mekân tutarlı mı?

Yanıtı Türkçe, profesyonel hukuk diliyle ve DÜZ METİN olarak yaz (markdown sembolü kullanma):
önce "ÖZET" başlığı, sonra "HUKUKİ DEĞERLENDİRME" (uzman perspektifleri burada), en sonda "ÖNERİLER" (numaralı liste). Başlıklar kendi satırında, büyük harfle.`;

const ANALYSIS_PROMPTS: Record<string, string> = {
  ses: `Bu ses kaydını hukuki delil açısından analiz et:
1. Konuşmanın ana konusu, taraflar ve içerik özeti
2. Hukuki açıdan önemli ifadeler, ikrar/itiraf niteliğindeki beyanlar
3. Kaydın elde ediliş biçimine göre delil değeri (aleni mi, gizli kayıt mı; TCK m. 132-133 riski)
4. Olası kullanım alanları (hukuk/ceza yargılaması, arabuluculuk)
${UZMAN_CERCEVE}`,

  goruntu: `Bu görseli hukuki delil açısından analiz et:
1. Görselin içeriği, bağlamı ve görünür unsurları
2. Tarih/saat bilgisi, konum ipuçları, metadata göstergeleri
3. Olası hukuki önemi (kaza, yaralanma, hasar, hakaret vb.)
${UZMAN_CERCEVE}`,

  video: `Bu videoyu hukuki delil açısından analiz et:
1. Video içeriğinin özeti ve kritik anlar
2. Görsel/ses kalitesi ve bütünlük
3. Delil değeri ve güvenilirlik
${UZMAN_CERCEVE}`,

  pdf: `Bu belgeyi hukuki açıdan analiz et:
1. Belgenin türü, tarafları ve içeriği
2. Önemli hükümler, yükümlülükler ve şartlar
3. Risk faktörleri, eksik veya muğlak hükümler
4. İmza/tarih/şekil şartları yönünden geçerlilik göstergeleri
${UZMAN_CERCEVE}`,

  ekran: `Bu ekran görüntüsünü hukuki delil açısından analiz et:
1. Kaynağı ve içeriği (sosyal medya, mesajlaşma, e-posta vb.)
2. Tarih/saat bilgileri ve kimlik göstergeleri
3. Dijital delil olarak kullanılabilirlik (değiştirilebilirlik riski, tespit ihtiyacı — noter/e-tespit)
${UZMAN_CERCEVE}`,

  ses_karsilastirma: `Bu iki ses kaydını karşılaştır ve hukuki açıdan analiz et:
1. Her iki kaydın içerik özeti
2. Ses karakteristiklerinin benzerliği/farklılığı, konuşmacı kimliği bulguları
3. Kayıtlar arasındaki tutarsızlık ve çelişkiler
${UZMAN_CERCEVE}`,
};

export async function POST(req: NextRequest) {
  let quotaUserId: string | null = null;
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const serviceSupabase = createServiceClient() as AnyClient;
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("user_type, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "avukat") {
      return NextResponse.json({ error: "Bu özellik sadece avukatlar içindir" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const analysisType = formData.get("analysisType") as string;
    const caseId = formData.get("caseId") as string | null;

    if (!file || !analysisType) {
      return NextResponse.json({ error: "Dosya ve analiz türü zorunludur" }, { status: 400 });
    }

    const allowedTypes = ["goruntu", "pdf", "ekran", "video", "ses", "ses_karsilastirma"];
    if (!allowedTypes.includes(analysisType)) {
      return NextResponse.json({ error: "Geçersiz analiz türü" }, { status: 400 });
    }

    const hasFalKey = !!process.env.FAL_KEY;

    // Ses/video için FAL_KEY gerekli; yoksa bilgilendirme döndür
    if ((analysisType === "ses" || analysisType === "video" || analysisType === "ses_karsilastirma") && !hasFalKey) {
      return NextResponse.json({
        success: true,
        analysisType,
        result: {
          ozet: "Ses ve video analizi fal.ai entegrasyonu gerektirir.",
          hukukiDegerlendirme: "Bu analiz türü için FAL_KEY ortam değişkeni ayarlanmalıdır. fal.ai hesabı oluşturarak API anahtarınızı .env.local dosyasına ekleyiniz.",
          oneriler: [
            "FAL_KEY ortam değişkenini .env.local dosyasına ekleyin",
            "fal.ai platformunda hesap oluşturun: https://fal.ai",
            "Whisper modeli ses transkripsiyonu için kullanılacaktır",
          ],
          kaynak: "fal.ai/whisper",
          demo: true,
          falKeyGerekildi: true,
        },
        fileName: file.name,
        fileSize: file.size,
        caseId: caseId || null,
      });
    }

    // Sorgu kotası harcaması (AI çağrısı = 1 kota) — doğrulamalardan sonra,
    // gerçek AI çalışmasından hemen önce düşülür
    const hasQuota = await checkAndConsumeQuota(user.id);
    if (!hasQuota) {
      return NextResponse.json(QUOTA_EXHAUSTED_BODY, { status: 402 });
    }
    quotaUserId = user.id;

    if (hasFalKey && (analysisType === "ses" || analysisType === "video" || analysisType === "ses_karsilastirma")) {
      fal.config({ credentials: process.env.FAL_KEY });

      // Dosyayı fal.ai storage'a yükle
      const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
      const uploadedUrl = await fal.storage.upload(fileBlob);

      let transkript = "";

      if (analysisType === "ses" || analysisType === "ses_karsilastirma") {
        // Whisper ile ses transkripti
        const result = await fal.subscribe("fal-ai/whisper", {
          input: { audio_url: uploadedUrl, language: "tr", task: "transcribe" },
        }) as { text?: string };
        transkript = result?.text ?? "";
      } else if (analysisType === "video") {
        // Video için ses çıkar ve transkript al
        const result = await fal.subscribe("fal-ai/whisper", {
          input: { audio_url: uploadedUrl, language: "tr", task: "transcribe" },
        }) as { text?: string };
        transkript = result?.text ?? "";
      }

      // Transkript + Claude ile hukuki analiz
      const prompt = ANALYSIS_PROMPTS[analysisType] ?? ANALYSIS_PROMPTS.ses;
      const claudeRes = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: transkript
            ? `${prompt}\n\nTranskript:\n${transkript}`
            : prompt,
        }],
        system: `Sen Mizanım hukuk platformunun AI asistanısın. Türk hukuku uzmanısın. Hukuki BİLGİ veriyorsun, hukuki TAVSİYE vermiyorsun.` + MIZAN_ORTAK_KURALLAR,
      });

      const analysisText = aiCiktiTemizle(claudeRes.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n"));

      const sections = parseAnalysisText(analysisText);

      return NextResponse.json({
        success: true,
        analysisType,
        result: {
          ozet: sections.ozet || analysisText.substring(0, 300),
          hukukiDegerlendirme: sections.hukukiDegerlendirme || analysisText,
          oneriler: sections.oneriler || [],
          transkript: transkript || undefined,
          kaynak: "fal.ai/whisper + Claude AI",
          rawText: analysisText,
          demo: false,
        },
        fileName: file.name,
        fileSize: file.size,
        caseId: caseId || null,
      });
    }

    // Claude multimodal ile görüntü/PDF/ekran analizi
    const fileBytes = await file.arrayBuffer();
    const base64Data = Buffer.from(fileBytes).toString("base64");
    const mimeType = file.type || "application/octet-stream";

    const prompt = ANALYSIS_PROMPTS[analysisType] || ANALYSIS_PROMPTS.goruntu;

    // Claude desteklediği medya tipleri
    const supportedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const isPdf = mimeType === "application/pdf";
    const isImage = supportedImageTypes.includes(mimeType);

    if (!isImage && !isPdf) {
      // Desteklenmeyen format AI'a gitmedi — kota iade
      await refundQuota(user.id);
      return NextResponse.json({
        error: `Bu dosya türü (${mimeType}) Claude ile analiz edilemiyor. Desteklenen formatlar: JPEG, PNG, GIF, WEBP, PDF`,
      }, { status: 400 });
    }

    type ContentBlock =
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
      | { type: "text"; text: string };

    const contentBlocks: ContentBlock[] = [];

    if (isImage) {
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType,
          data: base64Data,
        },
      });
    } else if (isPdf) {
      contentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64Data,
        },
      });
    }

    contentBlocks.push({
      type: "text",
      text: prompt,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: contentBlocks as AnyClient,
        },
      ],
      system: `Sen Mizanım hukuk platformunun AI asistanısın. Türk hukuku uzmanısın.
Hukuki BİLGİ veriyorsun, hukuki TAVSİYE vermiyorsun.
Her analizde kaynakları belirt ve nesnel değerlendirme yap.` + MIZAN_ORTAK_KURALLAR,
    });

    const analysisText = aiCiktiTemizle(response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as AnyClient).text)
      .join("\n"));

    // Analiz metnini yapılandır
    const sections = parseAnalysisText(analysisText);

    return NextResponse.json({
      success: true,
      analysisType,
      result: {
        ozet: sections.ozet || analysisText.substring(0, 300),
        hukukiDegerlendirme: sections.hukukiDegerlendirme || analysisText,
        oneriler: sections.oneriler || [],
        kaynak: "Claude AI (claude-sonnet-4-6)",
        rawText: analysisText,
        demo: false,
      },
      fileName: file.name,
      fileSize: file.size,
      caseId: caseId || null,
    });
  } catch (err) {
    console.error("Medya analiz error:", err);
    // Başarısız çağrı kotadan yemez
    if (quotaUserId) await refundQuota(quotaUserId);
    return NextResponse.json({ error: "Analiz sırasında hata oluştu" }, { status: 500 });
  }
}

function parseAnalysisText(text: string): {
  ozet?: string;
  hukukiDegerlendirme?: string;
  oneriler?: string[];
} {
  // Hem eski markdown ("## Özet") hem yeni düz metin ("ÖZET") başlıklarını tanır
  const lines = text.split("\n");
  const oneriler: string[] = [];
  const ozetSatirlari: string[] = [];
  const degerlendirmeSatirlari: string[] = [];

  let bolum: "ozet" | "degerlendirme" | "oneriler" | "" = "";

  for (const line of lines) {
    const trimmed = line.trim();
    const baslik = trimmed.replace(/^#+\s*/, "").replace(/:$/, "");

    if (/^(özet|ÖZET|içerik|ana konu)/i.test(baslik) && baslik.length < 30) { bolum = "ozet"; continue; }
    if (/^(öner|ÖNER|dikkat|tavsiye|sonuç)/i.test(baslik) && baslik.length < 40) { bolum = "oneriler"; continue; }
    if (/^(hukuki|HUKUKİ|değerlend|analiz)/i.test(baslik) && baslik.length < 40) { bolum = "degerlendirme"; continue; }

    if (!trimmed) continue;
    if (bolum === "oneriler" && (trimmed.startsWith("-") || trimmed.startsWith("•") || /^\d+\./.test(trimmed))) {
      oneriler.push(trimmed.replace(/^([-•]|\d+\.)\s*/, "").trim());
    } else if (bolum === "ozet") {
      ozetSatirlari.push(trimmed);
    } else if (bolum === "degerlendirme" || bolum === "oneriler") {
      degerlendirmeSatirlari.push(line.replace(/\s+$/, ""));
    } else if (!ozetSatirlari.length && trimmed.length > 50) {
      // Başlıksız yanıt — ilk uzun paragraf özet sayılır
      ozetSatirlari.push(trimmed);
      bolum = "degerlendirme";
    }
  }

  const ozet = ozetSatirlari.join(" ").trim();
  let hukukiDegerlendirme = degerlendirmeSatirlari.join("\n").trim();
  if (!hukukiDegerlendirme) hukukiDegerlendirme = text;

  return { ozet, hukukiDegerlendirme, oneriler };
}
