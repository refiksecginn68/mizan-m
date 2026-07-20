import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO = 25 * 1024 * 1024; // 25 MB

// Sesli metin (Whisper) uç noktası. FAL_KEY tanımlı değilse 501 döner ve UI
// ücretsiz tarayıcı sağlayıcısına (Web Speech) düşer. FAL_KEY gelince tek yerde
// devreye girer.
export async function POST(req: Request) {
  // Yetkili avukat oturumu şart
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

  // fal.ai Whisper: multipart ile ses gönder, transcript al
  const upstream = new FormData();
  upstream.append("audio", audio, "kayit.webm");
  upstream.append("language", lang);

  const res = await fetch("https://fal.run/fal-ai/whisper", {
    method: "POST",
    headers: { Authorization: `Key ${falKey}` },
    body: upstream,
  });
  if (!res.ok) {
    return Response.json({ error: "Whisper çözümlemesi başarısız" }, { status: 502 });
  }
  const data = (await res.json()) as { text?: string };
  return Response.json({ text: data.text ?? "" });
}
