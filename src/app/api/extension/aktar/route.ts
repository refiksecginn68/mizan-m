import { createServiceClient } from "@/lib/supabase/server";
import { verifyExtensionToken } from "@/lib/extension-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface UyapDava {
  esasNo: string;
  mahkemeAdi?: string;
  davaTuru?: string;
  davaciAdi?: string;
  davaliAdi?: string;
  durumu?: string;
  acilisTarihi?: string;
  safahat?: Array<{ tarih?: string; islem?: string; aciklama?: string }>;
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
    .from("profiles").select("user_type").eq("id", verified.userId).single();
  if (!profile || profile.user_type !== "avukat") {
    return Response.json({ error: "Avukat hesabı bulunamadı" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { davalar?: UyapDava[] } | null;
  const davalar = (body?.davalar ?? []).filter((d) => d.esasNo?.trim());
  if (davalar.length === 0) {
    return Response.json({ error: "Aktarılacak dava bulunamadı" }, { status: 400 });
  }

  const results: Array<{ esasNo: string; status: "eklendi" | "guncellendi" | "hata" }> = [];

  for (const dava of davalar.slice(0, 50)) {
    try {
      const { data: existing } = await svc
        .from("cases")
        .select("id")
        .eq("lawyer_id", verified.userId)
        .eq("case_number", dava.esasNo)
        .single();

      const notes = [
        dava.durumu ? `Durum: ${dava.durumu}` : "",
        dava.davaciAdi ? `Davacı: ${dava.davaciAdi}` : "",
        ...(dava.safahat ?? []).slice(0, 20).map((s) => `[${s.tarih ?? "-"}] ${s.islem ?? ""} ${s.aciklama ?? ""}`.trim()),
      ].filter(Boolean).join("\n");

      if (existing) {
        await svc.from("cases").update({
          court: dava.mahkemeAdi ?? undefined,
          opposing_party: dava.davaliAdi ?? undefined,
          notes: notes || undefined,
        }).eq("id", existing.id);
        results.push({ esasNo: dava.esasNo, status: "guncellendi" });
      } else {
        const { error } = await svc.from("cases").insert({
          lawyer_id: verified.userId,
          title: `${dava.davaTuru ?? "Dava"} — ${dava.esasNo}`,
          case_number: dava.esasNo,
          court: dava.mahkemeAdi ?? null,
          opposing_party: dava.davaliAdi ?? null,
          status: "aktif",
          description: `UYAP eklentisinden aktarıldı${dava.acilisTarihi ? ` · Açılış: ${dava.acilisTarihi}` : ""}`,
          notes: notes || null,
        });
        results.push({ esasNo: dava.esasNo, status: error ? "hata" : "eklendi" });
      }
    } catch {
      results.push({ esasNo: dava.esasNo, status: "hata" });
    }
  }

  return Response.json({
    success: true,
    eklendi: results.filter((r) => r.status === "eklendi").length,
    guncellendi: results.filter((r) => r.status === "guncellendi").length,
    hata: results.filter((r) => r.status === "hata").length,
    results,
  });
}
