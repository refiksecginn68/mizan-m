import { createClient } from "@/lib/supabase/server";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO = 25 * 1024 * 1024; // 25 MB

// Sesli metin (Whisper) uç noktası. FAL_KEY tanımlı değilse 501 döner ve UI
// ücretsiz tarayıcı sağlayıcısına (Web Speech) düşer. FAL_KEY gelince tek yerde
// devreye girer.
export async function POST(req: Request) {
  // Oturum şart (dikte hem avukat hem vatandaş panelinde kullanılıyor)
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum bulunamadı" }, { status: 401 });

  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return Response.json(
      { error: "Whisper sağlayıcısı yapılandırılmadı (FAL_KEY yok)." },
      { status: 501 },
    );
  }

  const form = await req.formData();
  const audio = form.get("audio");
  const lang = (form.get("lang") as string) || "tr";
  if (!(audio instanceof File)) {
    return Response.json({ error: "Ses dosyası gönderilmedi" }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO) {
    return Response.json({ error: "Ses kaydı çok büyük (max 25MB)" }, { status: 413 });
  }

  // fal.ai Whisper JSON API'si audio_url bekler (multipart ham ses kabul etmez):
  // önce storage'a yükle, sonra transkript al. Format cihaza göre değişir
  // (webm/opus, mp4/aac, ogg) — fal.storage hepsini kabul eder.
  try {
    fal.config({ credentials: falKey });
    const blob = new Blob([await audio.arrayBuffer()], { type: audio.type || "audio/webm" });
    const audioUrl = await fal.storage.upload(blob);

    // Whisper 2 harfli dil kodu bekler (tr-TR → tr); cast yalnızca tip içindir.
    const dil = lang.slice(0, 2) as "tr";
    const result = await fal.subscribe("fal-ai/whisper", {
      input: { audio_url: audioUrl, language: dil, task: "transcribe" },
    }) as { data?: { text?: string } };

    return Response.json({ text: result?.data?.text?.trim() ?? "" });
  } catch (err) {
    console.error("Whisper transcribe error:", err);
    return Response.json({ error: "Whisper çözümlemesi başarısız" }, { status: 502 });
  }
}
