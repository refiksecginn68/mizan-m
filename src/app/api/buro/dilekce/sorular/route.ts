import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Avukatın müvekkille ön görüşmesi gibi: dilekçe yazılmadan önce eksik bilgiler sorulur.
// Hafif ve hızlı bir model kullanılır; kota yalnızca asıl dilekçe üretiminde harcanır.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TUR = 3; // en fazla 3 tur soru — kullanıcı yorulmasın

export interface SoruTuru {
  soru: string;
  ipucu?: string;
}

const SYSTEM = `Sen deneyimli bir Türk avukatısın. Müvekkilin anlattığı olayı dinleyip, dilekçeyi
yazabilmek için EKSİK olan bilgileri tespit ediyorsun.

Dilekçe için kritik bilgiler: taraflar (davacı/davalı ad-unvan), talebin ne olduğu, olay/işlem
tarihleri, uyuşmazlığın dayanağı (sözleşme, fesih bildirimi, kaza vb.), yetkili/görevli mahkeme
için gereken yer bilgisi, talep edilen tutar (varsa).

KURALLAR:
- Bir turda EN FAZLA 2 soru sor. Kısa, net, tek cümlelik sorular kur.
- Kullanıcının ZATEN verdiği bilgiyi tekrar sorma.
- Yalnızca dilekçeyi somutlaştıracak, gerçekten belirleyici bilgileri sor.
- Yüklenen belgelerden çıkarılabilen bilgiyi sorma.
- Eksik kalan bilgi [KÖŞELİ PARANTEZ] yer tutucuyla geçiştirilebilecek türdense (ör. adres,
  T.C. no gibi rutin künye bilgisi) SORMA — bunlar yer tutucu olarak bırakılır.
- Dilekçeyi yazmak için yeterli bilgi varsa hiç soru sorma.

Yeterli bilgi topladığında ("hazir": true) "ozet" alanına, dilekçe yazılmadan önce avukatın onaylayacağı
kısa bir anlama-özeti koy: 4-8 kısa madde (taraflar, konu/talep, temel vakıa, varsa tutar/tarih, eksik kalan
kritik alanlar). Her madde tek satır, sade Türkçe, yer tutucular [KÖŞELİ PARANTEZ] ile. Soru sorarken ozet boş kalır.

Yanıtını YALNIZCA şu JSON biçiminde ver, başka hiçbir metin ekleme:
{"hazir": false, "sorular": [{"soru": "...", "ipucu": "..."}], "ozet": []}
veya yeterli bilgi varsa:
{"hazir": true, "sorular": [], "ozet": ["Davacı: ...", "Talep: ...", "..."]}`;

export async function POST(request: Request) {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Oturum bulunamadı" }, { status: 401 });

    const body = (await request.json()) as {
      konu?: string;
      tur?: string;
      dosyaMetni?: string;
      ekBilgi?: string;
      sablonBaslik?: string;
      sohbet?: { soru: string; cevap: string }[];
    };

    if (!body.konu?.trim()) {
      return Response.json({ error: "Dilekçe konusu gereklidir" }, { status: 400 });
    }

    const sohbet = body.sohbet ?? [];
    // Tur sınırına gelindiyse daha fazla soru sorma
    if (sohbet.length >= MAX_TUR * 2) {
      return Response.json({ hazir: true, sorular: [], ozet: [] });
    }

    const gecmis = sohbet.length
      ? "\n\nDaha önce sorulan ve yanıtlananlar:\n" +
        sohbet.map((s) => `S: ${s.soru}\nC: ${s.cevap}`).join("\n")
      : "";

    const userMessage = [
      `Müvekkilin anlattığı olay: ${body.konu}`,
      body.tur ? `Dilekçe türü: ${body.tur}` : "",
      body.sablonBaslik ? `Seçilen şablon: ${body.sablonBaslik}` : "",
      body.ekBilgi ? `Avukatın ek notu: ${body.ekBilgi}` : "",
      body.dosyaMetni
        ? `Yüklenen belgelerden çıkarılan metin (bu bilgiler zaten elimizde, tekrar sorma):\n${body.dosyaMetni.slice(0, 8000)}`
        : "",
      gecmis,
      "\nDilekçeyi yazabilmek için eksik olan bilgileri sor.",
    ].filter(Boolean).join("\n");

    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });

    const ham = res.content
      .filter((c): c is Anthropic.Messages.TextBlock => c.type === "text")
      .map((c) => c.text).join("").trim();

    // Model bazen JSON'u kod çitiyle sarar
    const json = ham.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { hazir?: boolean; sorular?: SoruTuru[]; ozet?: string[] };
    try {
      parsed = JSON.parse(json);
    } catch {
      // JSON bozuksa akışı tıkama — dilekçeyi doğrudan üretmeye izin ver
      console.error("sorular: JSON ayrıştırılamadı:", ham.slice(0, 200));
      return Response.json({ hazir: true, sorular: [], ozet: [] });
    }

    const sorular = (parsed.sorular ?? []).filter((s) => s?.soru?.trim()).slice(0, 2);
    const hazir = parsed.hazir === true || sorular.length === 0;
    const ozet = hazir
      ? (parsed.ozet ?? []).map((o) => `${o}`.trim()).filter(Boolean).slice(0, 8)
      : [];
    return Response.json({
      hazir,
      sorular,
      ozet,
      tur: Math.floor(sohbet.length / 2) + 1,
      maxTur: MAX_TUR,
    });
  } catch (err) {
    console.error("sorular hatası:", err);
    return Response.json({ error: "Sorular hazırlanamadı" }, { status: 500 });
  }
}
