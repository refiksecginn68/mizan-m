import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    konu: string;
    ekBilgi?: string;
    dosyaMetni?: string;
    mod: "ai" | "duzenle";
    mevcutMetin?: string;
  };

  if (!body.konu?.trim()) {
    return Response.json({ error: "Dilekçe konusu gereklidir" }, { status: 400 });
  }

  // Avukat profili
  const serviceSupabase = createServiceClient() as Any;
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const avukatAd = profile?.full_name ?? "Avukat";

  const systemPrompt = `Sen Türk hukuku alanında uzman, 20 yıllık deneyimli bir avukatsın.
Meslektaşın olan Av. ${avukatAd} için profesyonel hukuki belgeler hazırlıyorsun.

KURALLAR:
- Türk hukuku ve usulüne tam uygunluk
- Doğru mahkeme hitabı ve standart dilekçe formatı
- İlgili kanun maddeleri ve içtihat atıfları
- Profesyonel, resmi Türkçe
- Dilekçenin tüm zorunlu bölümleri: başlık, yetkili makam, taraflar, konu, açıklama, hukuki dayanak, sonuç ve talep, saygılarımla + imza yeri
- Sadece dilekçe metnini üret, ek açıklama ekleme`;

  const userMessage = body.mod === "duzenle" && body.mevcutMetin
    ? `Aşağıdaki dilekçeyi şu yönde düzenle/iyileştir:\n\nYeni konu/talimat: ${body.konu}\n\nMevcut dilekçe:\n${body.mevcutMetin}`
    : `Konu: ${body.konu}${body.ekBilgi ? `\n\nEk bilgi:\n${body.ekBilgi}` : ""}${body.dosyaMetni ? `\n\nYüklenen belgeden çıkarılan bilgi:\n${body.dosyaMetni.slice(0, 3000)}` : ""}\n\nBu konuda profesyonel bir dilekçe hazırla.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const metin = response.content[0].type === "text" ? response.content[0].text : "";

  // DB kayıt
  await serviceSupabase.from("generated_documents").insert({
    user_id: user.id,
    title: body.konu.slice(0, 100),
    document_type: "avukat_dilekce",
    content: metin,
  }).then(() => {}).catch(() => {});

  return Response.json({ metin });
}
