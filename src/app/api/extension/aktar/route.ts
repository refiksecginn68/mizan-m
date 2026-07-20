import { createServiceClient } from "@/lib/supabase/server";
import { verifyExtensionToken } from "@/lib/extension-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface Taraf { rol?: string; tip?: string; ad?: string; vekil?: string }

interface UyapDava {
  esasNo: string;
  mahkemeAdi?: string;
  davaTuru?: string;
  davaciAdi?: string;
  davaliAdi?: string;
  durumu?: string;
  acilisTarihi?: string;
  taraflar?: Taraf[];
  evraklar?: Array<{ ad?: string; tarih?: string }>;
  safahat?: Array<{ tarih?: string; islem?: string; aciklama?: string }>;
}

const norm = (s?: string) => (s ?? "").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

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
      const evrakSatir = (dava.evraklar ?? []).slice(0, 40)
        .map((e) => `  - ${e.tarih ? `[${e.tarih}] ` : ""}${e.ad ?? ""}`.trimEnd());
      const notes = [
        dava.durumu ? `Durum: ${dava.durumu}` : "",
        muvekkilAdi ? `Müvekkil: ${muvekkilAdi}` : (dava.davaciAdi ? `Davacı: ${dava.davaciAdi}` : ""),
        taraflarSatir.length ? "Taraflar:\n" + taraflarSatir.join("\n") : "",
        evrakSatir.length ? "Evraklar:\n" + evrakSatir.join("\n") : "",
        ...(dava.safahat ?? []).slice(0, 30).map((s) => `[${s.tarih ?? "-"}] ${s.islem ?? ""} ${s.aciklama ?? ""}`.trim()),
      ].filter(Boolean).join("\n");

      if (existing) {
        await svc.from("cases").update({
          court: dava.mahkemeAdi ?? undefined,
          opposing_party: dava.davaliAdi ?? undefined,
          uyap_status: dava.durumu ?? undefined,
          is_uyap_synced: true,
          // Mevcut bağlantıyı ezme; yalnızca boşsa yeni müvekkili bağla
          client_id: existing.client_id ?? clientId ?? undefined,
          notes: notes || undefined,
        }).eq("id", existing.id);
        results.push({ esasNo: dava.esasNo, status: "guncellendi", muvekkil: !!clientId });
      } else {
        const { error } = await svc.from("cases").insert({
          lawyer_id: verified.userId,
          client_id: clientId ?? null,
          client_name: !clientId && muvekkilAdi ? muvekkilAdi : null,
          title: `${dava.davaTuru ?? "Dava"} — ${dava.esasNo}`,
          case_number: dava.esasNo,
          court: dava.mahkemeAdi ?? null,
          case_type: dava.davaTuru ?? null,
          opposing_party: dava.davaliAdi ?? null,
          status: "aktif",
          uyap_status: dava.durumu ?? null,
          is_uyap_synced: true,
          description: `UYAP eklentisinden aktarıldı${dava.acilisTarihi ? ` · Açılış: ${dava.acilisTarihi}` : ""}`,
          notes: notes || null,
        });
        results.push({ esasNo: dava.esasNo, status: error ? "hata" : "eklendi", muvekkil: !!clientId });
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
