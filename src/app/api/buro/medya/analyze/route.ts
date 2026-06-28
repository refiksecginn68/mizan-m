import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ANALYSIS_PROMPTS: Record<string, string> = {
  ses: `Bu ses kaydını hukuki delil açısından analiz et. Şunları değerlendir:
1. Konuşmanın ana konusu ve içeriği
2. Hukuki açıdan önemli ifadeler veya itiraflar
3. Ses kaydının delil değeri (gönüllü mü, gizli mi?)
4. Olası kullanım alanları (mahkeme, arabuluculuk, vb.)
5. Dikkat edilmesi gereken hususlar

Yanıtı Türkçe ver ve profesyonel hukuki bir dille yaz.`,

  goruntu: `Bu görseli hukuki delil açısından analiz et. Şunları değerlendir:
1. Görselin içeriği ve bağlamı
2. Görülebilen tarih/saat bilgisi veya metadata ipuçları
3. Delil olarak kullanılabilirlik ve güvenilirlik
4. Olası hukuki önemi (kaza, yaralanma, hasar, vb.)
5. Dikkat edilmesi gereken teknik veya hukuki sorunlar

Yanıtı Türkçe ver ve profesyonel hukuki bir dille yaz.`,

  video: `Bu videoyu hukuki delil açısından analiz et. Şunları değerlendir:
1. Video içeriğinin özeti
2. Hukuki açıdan kritik anlar
3. Görsel ve ses kalitesi
4. Delil değeri ve güvenilirlik
5. Dikkat edilmesi gereken hususlar

Yanıtı Türkçe ver ve profesyonel hukuki bir dille yaz.`,

  pdf: `Bu belgeyi hukuki açıdan analiz et. Şunları değerlendir:
1. Belgenin türü ve içeriği
2. Taraflar ve yükümlülükler
3. Önemli hükümler, maddeler ve şartlar
4. Risk faktörleri ve dikkat edilmesi gereken alanlar
5. Eksik veya muğlak hükümler

Yanıtı Türkçe ver ve profesyonel hukuki bir dille yaz.`,

  ekran: `Bu ekran görüntüsünü hukuki delil açısından analiz et. Şunları değerlendir:
1. Görüntünün kaynağı ve içeriği (sosyal medya, mesajlaşma, e-posta vb.)
2. Tarih ve saat bilgileri
3. Delil olarak kullanılabilirlik
4. İçeriğin hukuki önemi
5. Dijital delil olarak dikkat edilmesi gereken hususlar

Yanıtı Türkçe ver ve profesyonel hukuki bir dille yaz.`,

  ses_karsilastirma: `Bu iki ses kaydını karşılaştır ve hukuki açıdan analiz et. Şunları değerlendir:
1. Her iki kaydın içerik özeti
2. Ses karakteristiklerinin benzerliği/farklılığı
3. Konuşmacı kimliği açısından bulgular
4. Tutarsızlıklar veya çelişkiler
5. Karşılaştırmanın hukuki değeri

Yanıtı Türkçe ver ve profesyonel hukuki bir dille yaz.`,
};

export async function POST(req: NextRequest) {
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
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: transkript
            ? `${prompt}\n\nTranskript:\n${transkript}`
            : prompt,
        }],
        system: `Sen Mizanım hukuk platformunun AI asistanısın. Türk hukuku uzmanısın. Hukuki BİLGİ veriyorsun, hukuki TAVSİYE vermiyorsun. Yanıtlarını Markdown formatında yaz.`,
      });

      const analysisText = claudeRes.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n");

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
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: contentBlocks as AnyClient,
        },
      ],
      system: `Sen Mizanım hukuk platformunun AI asistanısın. Türk hukuku uzmanısın.
Hukuki BİLGİ veriyorsun, hukuki TAVSİYE vermiyorsun.
Her analizde kaynakları belirt ve nesnel değerlendirme yap.
Yanıtlarını Markdown formatında yaz.`,
    });

    const analysisText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as AnyClient).text)
      .join("\n");

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
    return NextResponse.json({ error: "Analiz sırasında hata oluştu" }, { status: 500 });
  }
}

function parseAnalysisText(text: string): {
  ozet?: string;
  hukukiDegerlendirme?: string;
  oneriler?: string[];
} {
  const lines = text.split("\n").filter((l) => l.trim());
  const oneriler: string[] = [];
  let ozet = "";
  let hukukiDegerlendirme = "";

  let inOneriler = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.match(/^#+\s*(özet|içerik|ana konu)/i)) {
      inOneriler = false;
      continue;
    }

    if (trimmed.match(/^#+\s*(öner|dikkat|tavsiye|sonuç)/i)) {
      inOneriler = true;
      continue;
    }

    if (trimmed.match(/^#+\s*(hukuki|değerlend|analiz)/i)) {
      inOneriler = false;
      continue;
    }

    if (inOneriler && (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.match(/^\d+\./))) {
      oneriler.push(trimmed.replace(/^[-•\d.]\s*/, "").trim());
    } else if (!ozet && trimmed.length > 50 && !trimmed.startsWith("#")) {
      ozet = trimmed;
    } else if (ozet && !hukukiDegerlendirme && trimmed.length > 50 && !trimmed.startsWith("#")) {
      hukukiDegerlendirme = trimmed;
    }
  }

  if (!hukukiDegerlendirme) hukukiDegerlendirme = text;

  return { ozet, hukukiDegerlendirme, oneriler };
}
