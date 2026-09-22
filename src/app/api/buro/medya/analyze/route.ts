import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkAndConsumeQuota, refundQuota, QUOTA_EXHAUSTED_BODY } from "@/lib/quota";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";
import { MIZAN_ORTAK_KURALLAR } from "@/lib/ai/prompts";
import { aiCiktiTemizle } from "@/lib/ai/ai-cikti";
import { guvenliMaskele, geriDoldur } from "@/lib/services/maskele";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Analiz odakları (tür bazlı) — kısa, maddi.
const ODAK: Record<string, string> = {
  ses: "Bu ses kaydında GEÇEN ifadeleri maddi olarak çıkar; ikrar/itiraf, tehdit, borç/ödeme beyanı gibi kritik yerleri işaretle.",
  ses_karsilastirma: "İki ses kaydında GEÇEN ifadeleri ve konuşmacı farklılık bulgularını maddi olarak çıkar.",
  video: "Bu videoda GÖRÜLEN/DUYULAN kritik unsurları maddi olarak çıkar.",
  goruntu: "Bu görselde GÖRÜLEN unsurları (tarih/saat, konum ipuçları, kişi/eşya) maddi olarak çıkar.",
  ekran: "Bu ekran görüntüsünde GÖRÜLEN içeriği (mesaj metni, tarih/saat, taraf adları) maddi olarak çıkar.",
  pdf: "Bu belgede GEÇEN kritik hükümleri (taraf, tutar, tarih, yükümlülük) maddi olarak çıkar.",
};

// Ortak çıktı sözleşmesi — SADECE JSON. Kısa/maddi varsayılan + detaylı ayrı alanda.
const JSON_TALIMAT = `Yanıtını SADECE geçerli JSON olarak ver, başka hiçbir metin ekleme:
{
  "tespitler": [
    { "zaman": "04:12" veya null, "kategori": "kirmizi|sari|mavi", "etiket": "kısa olgusal etiket", "alinti": "medyada birebir geçen ifade veya görünen unsur", "guven": "yuksek|dusuk" }
  ],
  "kaliteNotu": "bulanık/gürültülü/kesik ise tek cümle; sorun yoksa null",
  "detayli": "Avukat gözüyle / Hâkim gözüyle / Savcı gözüyle / Bilirkişi gözüyle perspektifleri + delil niteliği (hukuka uygunluk, kesin/takdiri) + çelişki-tutarlılık. Düz metin, başlıklar büyük harf, markdown sembolü YOK."
}
KURALLAR:
- "tespitler" KISA ve MADDİ (3-8 madde). YORUM/DEĞERLENDİRME YOK: "kazanılır", "lehe delildir" YAZMA. Sadece medyada NE GEÇTİĞİNİ yaz.
- kategori: kirmizi = suç teşkil edebilecek/ağır (tehdit, şantaj, cebir, hakaret, rüşvet, iftira, suç ikrarı); sari = borç/sözleşme (borç ikrarı/kabulü, ödeme vaadi, miktar/tarih taahhüdü, sözleşme beyanı); mavi = usul/delil (kaydın nasıl elde edildiği, rıza/gizlilik beyanı, üçüncü kişi beyanı).
- etiket OLGUSAL olsun ("tehdit içerebilir", "borç ikrarı") — suç İSNADI değil.
- Emin değilsen guven:"dusuk". Zorlama vurgulama yapma.
- Okunamayan plaka/isim/rakam: "okunamadı" veya "kısmen: 06 ?? 1234". Tahmin YOK.
- Yüz tanımayla kimlik atama YOK. Markdown sembolü YOK.`;

interface Tespit {
  zaman: string | null;
  kategori: "kirmizi" | "sari" | "mavi";
  etiket: string;
  alinti: string;
  guven: "yuksek" | "dusuk";
}
interface YapiliSonuc {
  tespitler: Tespit[];
  kaliteNotu: string | null;
  detayli: string;
}

// Claude JSON çıktısını güvenli ayrıştır; bozuksa ham metni "detayli"ye koy.
function sonucAyristir(raw: string): YapiliSonuc {
  const temiz = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const j = JSON.parse(temiz) as Partial<YapiliSonuc>;
    const gecerliKat = new Set(["kirmizi", "sari", "mavi"]);
    const tespitler = Array.isArray(j.tespitler)
      ? j.tespitler
          .filter((t) => t && typeof t.alinti === "string" && gecerliKat.has(t.kategori as string))
          .map((t) => ({
            zaman: typeof t.zaman === "string" ? t.zaman : null,
            kategori: t.kategori as Tespit["kategori"],
            etiket: typeof t.etiket === "string" ? t.etiket : "tespit",
            alinti: t.alinti as string,
            guven: t.guven === "dusuk" ? "dusuk" as const : "yuksek" as const,
          }))
      : [];
    return {
      tespitler,
      kaliteNotu: typeof j.kaliteNotu === "string" && j.kaliteNotu.trim() ? j.kaliteNotu.trim() : null,
      detayli: typeof j.detayli === "string" ? j.detayli.trim() : "",
    };
  } catch {
    return { tespitler: [], kaliteNotu: null, detayli: raw.trim() };
  }
}

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

    // Ses/video transkript motoru (fal.ai) yapılandırılmamışsa sahte "başarı"
    // değil, açık hata dön — kullanıcı yanlış yönlendirilmesin.
    if ((analysisType === "ses" || analysisType === "video" || analysisType === "ses_karsilastirma") && !hasFalKey) {
      return NextResponse.json(
        { error: "Ses/video analiz motoru şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
        { status: 503 },
      );
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

      if (analysisType === "ses" || analysisType === "ses_karsilastirma" || analysisType === "video") {
        // Whisper ile ses transkripti (video'da ses kanalı çözümlenir).
        // @fal-ai/client sonucu { data, requestId } sarar; metin data.text altında.
        const result = await fal.subscribe("fal-ai/whisper", {
          input: { audio_url: uploadedUrl, language: "tr", task: "transcribe" },
        }) as { data?: { text?: string } };
        transkript = result?.data?.text?.trim() ?? "";
      }

      // Transkript metne dönüştükten SONRA maskelenir — bkz.
      // content/legal/yurt-disina-aktarim-bildirimi.v1.md madde 5. Ham ses/görüntü
      // fal.ai Whisper'a maskelenmeden gider (teknik olarak mümkün değil); yalnızca
      // dönen METİN, Anthropic'e gitmeden önce maskeleme katmanından geçirilir.
      const bilinenDegerler: { deger: string; tur: "kisi" }[] = [];
      if (caseId) {
        const { data: davaBilgi } = await serviceSupabase
          .from("cases")
          .select("opposing_party, client_id, clients(full_name)")
          .eq("id", caseId)
          .eq("lawyer_id", user.id)
          .maybeSingle();
        if (davaBilgi?.opposing_party) bilinenDegerler.push({ deger: davaBilgi.opposing_party, tur: "kisi" });
        const muvekkilAdi = (davaBilgi as AnyClient)?.clients?.full_name;
        if (muvekkilAdi) bilinenDegerler.push({ deger: muvekkilAdi, tur: "kisi" });
      }

      const not = (formData.get("not") as string | null)?.trim();
      const baglam = (formData.get("baglam") as string | null)?.trim();
      const maskeliTranskript = guvenliMaskele(transkript || "(transkript boş)", bilinenDegerler);
      const maskeliBaglam = baglam ? guvenliMaskele(baglam, bilinenDegerler) : null;
      // İki metnin eşlemesini birleştir — geri doldurma tek eşleme tablosuyla yapılır
      const birlesikEsleme = new Map(maskeliTranskript.esleme);
      maskeliBaglam?.esleme.forEach((v, k) => birlesikEsleme.set(k, v));

      const prompt = `${ODAK[analysisType] ?? ODAK.ses}\n\n${JSON_TALIMAT}`;
      const claudeRes = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: `${prompt}\n\nTranskript:\n${maskeliTranskript.maskeliMetin}${maskeliBaglam ? `\n\nAvukatın verdiği bağlam (yalnızca yorumlamaya yardımcı, tespitlerde birebir kullanma): ${maskeliBaglam.maskeliMetin}` : ""}`,
        }],
        system: `Sen adli bilirkişi gibi davranan bir analiz asistanısın. SADECE duyulan/görüleni maddi olarak raporlarsın; hukuki nitelendirme veya suç isnadı yapmazsın. Metindeki [KİŞİ-1], [TCKN-1] gibi köşeli parantezli etiketleri AYNEN KORU, gerçek isim/numara UYDURMA.` + MIZAN_ORTAK_KURALLAR,
      });

      const rawText = claudeRes.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n");

      const yapili = sonucAyristir(geriDoldur(rawText, birlesikEsleme));

      return NextResponse.json({
        success: true,
        analysisType,
        result: {
          transkript: transkript || undefined,
          tespitler: yapili.tespitler,
          kaliteNotu: yapili.kaliteNotu,
          detayli: aiCiktiTemizle(yapili.detayli),
          not: not || undefined,
          kaynak: "Transkripsiyon (fal.ai Whisper) + Claude AI",
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

    const not = (formData.get("not") as string | null)?.trim();
    const baglam = (formData.get("baglam") as string | null)?.trim();
    const prompt = `${ODAK[analysisType] || ODAK.goruntu}${baglam ? `\n\nAvukatın verdiği bağlam: ${baglam}` : ""}\n\n${JSON_TALIMAT}`;

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

    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as AnyClient).text)
      .join("\n");

    const yapili = sonucAyristir(rawText);

    return NextResponse.json({
      success: true,
      analysisType,
      result: {
        tespitler: yapili.tespitler,
        kaliteNotu: yapili.kaliteNotu,
        detayli: aiCiktiTemizle(yapili.detayli),
        not: not || undefined,
        kaynak: "Claude AI (claude-sonnet-4-6)",
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
