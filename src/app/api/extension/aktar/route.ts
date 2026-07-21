import { createServiceClient } from "@/lib/supabase/server";
import { verifyExtensionToken } from "@/lib/extension-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface Taraf { rol?: string; tip?: string; ad?: string; vekil?: string; muvekkil?: boolean }

interface UyapDava {
  esasNo: string;
  mahkemeAdi?: string;
  davaTuru?: string;
  davaciAdi?: string;
  davaliAdi?: string;
  durumu?: string;
  acilisTarihi?: string;
  taraflar?: Taraf[];
  evraklar?: Array<{ ad?: string; tarih?: string; klasor?: string; itemId?: string }>;
  safahat?: Array<{ tarih?: string; islem?: string; aciklama?: string }>;
}

const norm = (s?: string) => (s ?? "").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

// UYAP dosya durumu metnini (İstinafta, Yargıtayda, Kapalı, Karara Çıkmış...) liste UI'ının
// kullandığı status kovasına eşler. Boş durumda undefined döner (mevcut status'e dokunma).
function durumBucket(durum?: string): "aktif" | "beklemede" | "istinaf_temyiz" | "kapatildi" | undefined {
  const d = norm(durum);
  if (!d) return undefined;
  if (/istinaf|yarg[ıi]tay|temyiz/.test(d)) return "istinaf_temyiz";
  if (/kapal|kesinle[şs]|reddedil|d[üu][şs]t[üu]|i[şs]lemden kald/.test(d)) return "kapatildi";
  if (/karar/.test(d)) return "beklemede"; // Karara çıkmış → kesinleşmeyi bekliyor
  return "aktif"; // Açık, Derdest, vb.
}

// Vekili avukatın adını içeren tarafı müvekkil kabul eder (Avukat Portalı taraf tablosu).
function muvekkilAdiBul(dava: UyapDava, lawyerName: string): string | undefined {
  const ln = norm(lawyerName).replace(/^av\.?\s*/, "");
  if (ln && dava.taraflar?.length) {
    const eslesen = dava.taraflar.find((t) => t.ad && norm(t.vekil).includes(ln));
    if (eslesen?.ad) return eslesen.ad.trim();
  }
  return undefined;
}

// Var olan müvekkili adla eşleştirir; yoksa oluşturur. clientId veya undefined döner.
async function muvekkilBagla(svc: Any, lawyerId: string, ad: string): Promise<string | undefined> {
  const isim = ad.trim();
  if (isim.length < 3) return undefined;
  const { data: mevcut } = await svc
    .from("clients").select("id, full_name").eq("lawyer_id", lawyerId);
  const bulunan = (mevcut ?? []).find((c: Any) => norm(c.full_name) === norm(isim));
  if (bulunan) return bulunan.id;
  const { data: yeni } = await svc
    .from("clients")
    .insert({ lawyer_id: lawyerId, full_name: isim, uyap_synced: true, uyap_synced_at: new Date().toISOString() })
    .select("id").single();
  return yeni?.id;
}

// "04.05.2026 16:21" / "17/05/2026" → ISO (+03:00 Türkiye). Geçersizse undefined.
function parseUyapTarih(s?: string): string | undefined {
  const m = (s ?? "").match(/(\d{2})[./](\d{2})[./](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return undefined;
  const [, gg, aa, yyyy, hh, dk] = m;
  return `${yyyy}-${aa}-${gg}T${hh ?? "09"}:${dk ?? "00"}:00+03:00`;
}

// Karşı taraf: vekili avukat OLMAYAN ilk taraf (taraf tablosu Rol|Tipi|Adı|Vekil)
function karsiTarafBul(dava: UyapDava, lawyerName: string): string | undefined {
  const ln = norm(lawyerName).replace(/^av\.?\s*/, "");
  const karsi = (dava.taraflar ?? []).find((t) => t.ad && !(ln && norm(t.vekil).includes(ln)));
  return karsi?.ad?.trim();
}

// Safahattaki gelecekteki duruşma tarihlerini takvime işler (var olanı tekrarlamaz)
async function durusmaSenkron(svc: Any, lawyerId: string, caseId: string, clientId: string | undefined, dava: UyapDava) {
  const adaylar = (dava.safahat ?? [])
    .filter((s) => /duru[şs]ma|celse/i.test(`${s.islem ?? ""} ${s.aciklama ?? ""}`))
    .map((s) => parseUyapTarih(`${s.islem ?? ""} ${s.aciklama ?? ""} ${s.tarih ?? ""}`))
    .filter((iso): iso is string => !!iso && new Date(iso).getTime() > Date.now());
  if (adaylar.length === 0) return;

  const { data: mevcut } = await svc
    .from("calendar_events").select("starts_at")
    .eq("lawyer_id", lawyerId).eq("case_id", caseId).eq("event_type", "durusma");
  const varOlan = new Set((mevcut ?? []).map((e: Any) => new Date(e.starts_at).getTime()));

  for (const iso of Array.from(new Set(adaylar)).slice(0, 10)) {
    if (varOlan.has(new Date(iso).getTime())) continue;
    await svc.from("calendar_events").insert({
      lawyer_id: lawyerId,
      case_id: caseId,
      client_id: clientId ?? null,
      title: `Duruşma — ${dava.esasNo}`,
      description: dava.mahkemeAdi ?? null,
      event_type: "durusma",
      starts_at: iso,
      location: dava.mahkemeAdi ?? null,
    });
  }
}

function getToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

// Eklenti bağlantı doğrulama
export async function GET(request: Request) {
  const token = getToken(request);
  const verified = token ? verifyExtensionToken(token) : null;
  if (!verified) return Response.json({ ok: false, error: "Geçersiz veya süresi dolmuş bağlantı kodu" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data: profile } = await svc
    .from("profiles").select("full_name, user_type").eq("id", verified.userId).single();
  if (!profile || profile.user_type !== "avukat") {
    return Response.json({ ok: false, error: "Avukat hesabı bulunamadı" }, { status: 403 });
  }

  return Response.json({ ok: true, lawyerName: profile.full_name });
}

// UYAP'tan okunan dava verilerini Mizanım'a aktar
export async function POST(request: Request) {
  const token = getToken(request);
  const verified = token ? verifyExtensionToken(token) : null;
  if (!verified) return Response.json({ error: "Geçersiz veya süresi dolmuş bağlantı kodu" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { data: profile } = await svc
    .from("profiles").select("user_type, full_name").eq("id", verified.userId).single();
  if (!profile || profile.user_type !== "avukat") {
    return Response.json({ error: "Avukat hesabı bulunamadı" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { davalar?: UyapDava[] } | null;
  const davalar = (body?.davalar ?? []).filter((d) => d.esasNo?.trim());
  if (davalar.length === 0) {
    return Response.json({ error: "Aktarılacak dava bulunamadı" }, { status: 400 });
  }

  const results: Array<{ esasNo: string; status: "eklendi" | "guncellendi" | "hata"; muvekkil?: boolean }> = [];

  for (const dava of davalar.slice(0, 100)) {
    try {
      // Idempotent eşleşme: aynı avukat + esas no + birim tek dosyadır. .single() KULLANMA —
      // grupta >1 satır olunca hata döner ve her taramada yeni kayıt eklenirdi (mükerrer kaçağı).
      const { data: adaylar } = await svc
        .from("cases")
        .select("id, client_id, court")
        .eq("lawyer_id", verified.userId)
        .eq("case_number", dava.esasNo);
      const birimKey = norm(dava.mahkemeAdi);
      const existing = (adaylar ?? []).find((c: Any) => norm(c.court) === birimKey) ?? (adaylar ?? [])[0];

      // Müvekkil: taraf tablosunda vekili avukat olan taraf → bul/oluştur/bağla
      const muvekkilAdi = muvekkilAdiBul(dava, profile.full_name ?? "");
      let clientId: string | undefined;
      if (muvekkilAdi) {
        try { clientId = await muvekkilBagla(svc, verified.userId, muvekkilAdi); } catch { /* bağlama zorunlu değil */ }
      }

      const taraflarSatir = (dava.taraflar ?? []).slice(0, 12)
        .map((t) => `  • ${t.rol ?? "-"}: ${t.ad ?? "-"}${t.vekil ? ` (Vekil: ${t.vekil})` : ""}`);
      const notes = [
        dava.durumu ? `Durum: ${dava.durumu}` : "",
        muvekkilAdi ? `Müvekkil: ${muvekkilAdi}` : (dava.davaciAdi ? `Davacı: ${dava.davaciAdi}` : ""),
        taraflarSatir.length ? "Taraflar:\n" + taraflarSatir.join("\n") : "",
      ].filter(Boolean).join("\n");

      // Yapılandırılmış UYAP verisi: müvekkil işaretli taraflar + evrak ağacı meta + safahat
      const ln = norm(profile.full_name ?? "").replace(/^av\.?\s*/, "");
      const uyapTaraflar = (dava.taraflar ?? []).slice(0, 30).map((t) => ({
        ...t, muvekkil: !!(t.ad && ln && norm(t.vekil).includes(ln)),
      }));
      const karsiTaraf = karsiTarafBul(dava, profile.full_name ?? "");
      const acilisIso = parseUyapTarih(dava.acilisTarihi);

      const uyapAlanlar = {
        court: dava.mahkemeAdi ?? undefined,
        case_type: dava.davaTuru ?? undefined,
        opposing_party: karsiTaraf ?? dava.davaliAdi ?? undefined,
        status: durumBucket(dava.durumu) ?? undefined,
        uyap_status: dava.durumu ?? undefined,
        is_uyap_synced: true,
        uyap_taraflar: uyapTaraflar.length ? uyapTaraflar : undefined,
        uyap_evraklar: dava.evraklar?.length ? dava.evraklar.slice(0, 500) : undefined,
        uyap_safahat: dava.safahat?.length ? dava.safahat.slice(0, 120) : undefined,
        uyap_acilis_tarihi: dava.acilisTarihi ?? undefined,
        opened_at: acilisIso ? acilisIso.slice(0, 10) : undefined,
      };

      let caseId: string | undefined;
      if (existing) {
        await svc.from("cases").update({
          ...uyapAlanlar,
          // Mevcut bağlantıyı ezme; yalnızca boşsa yeni müvekkili bağla
          client_id: existing.client_id ?? clientId ?? undefined,
          notes: notes || undefined,
        }).eq("id", existing.id);
        caseId = existing.id;
        results.push({ esasNo: dava.esasNo, status: "guncellendi", muvekkil: !!clientId });
      } else {
        const { data: inserted, error } = await svc.from("cases").insert({
          lawyer_id: verified.userId,
          client_id: clientId ?? null,
          client_name: !clientId && muvekkilAdi ? muvekkilAdi : null,
          title: `${dava.davaTuru ?? "Dava"} — ${dava.esasNo}`,
          case_number: dava.esasNo,
          description: `UYAP eklentisinden aktarıldı${dava.acilisTarihi ? ` · Açılış: ${dava.acilisTarihi}` : ""}`,
          notes: notes || null,
          ...uyapAlanlar,
          status: durumBucket(dava.durumu) ?? "aktif",
        }).select("id").single();
        caseId = inserted?.id;
        results.push({ esasNo: dava.esasNo, status: error ? "hata" : "eklendi", muvekkil: !!clientId });
      }

      // Çapraz senkron: gelecekteki duruşmalar takvime (mükerrersiz)
      if (caseId) {
        try { await durusmaSenkron(svc, verified.userId, caseId, existing?.client_id ?? clientId, dava); }
        catch { /* takvim senkronu dosya aktarımını engellemesin */ }
      }
    } catch {
      results.push({ esasNo: dava.esasNo, status: "hata" });
    }
  }

  return Response.json({
    success: true,
    eklendi: results.filter((r) => r.status === "eklendi").length,
    guncellendi: results.filter((r) => r.status === "guncellendi").length,
    muvekkilBaglanan: results.filter((r) => r.muvekkil).length,
    hata: results.filter((r) => r.status === "hata").length,
    results,
  });
}
