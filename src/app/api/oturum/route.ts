// Aktif oturum (cihaz) yönetimi API'si.
// GET   → aktif cihaz listesi (profil "Aktif Oturumlar" için)
// POST  → kalp atışı: cihaz düşürüldüyse { aktif: false } döner, istemci çıkış yapar
// DELETE→ belirli cihazın oturumunu sonlandır

import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { kalpAtisi, aktifCihazlar, cihazDusur, CIHAZ_COOKIE } from "@/lib/services/oturum";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function istekBilgisi() {
  const h = headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;
  return { userAgent: h.get("user-agent"), ip };
}

export async function GET() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum gerekli" }, { status: 401 });

  const cihazlar = await aktifCihazlar(user.id);
  const mevcutDeviceId = cookies().get(CIHAZ_COOKIE)?.value ?? null;
  return Response.json({
    cihazlar: cihazlar.map((c) => ({
      id: c.id,
      userAgent: c.user_agent,
      ip: c.ip,
      girisTarihi: c.created_at,
      sonGorulme: c.last_seen_at,
      buCihaz: c.device_id === mevcutDeviceId,
    })),
  });
}

export async function POST() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum gerekli" }, { status: 401 });

  const cookieStore = cookies();
  const deviceId = cookieStore.get(CIHAZ_COOKIE)?.value ?? null;
  const { userAgent, ip } = istekBilgisi();

  const sonuc = await kalpAtisi(user.id, deviceId, userAgent, ip);

  if (!sonuc.aktif) {
    // Cihaz düşürülmüş — YALNIZCA bu cihazın Supabase oturumunu kapat
    // (varsayılan "global" kapsam diğer cihazdaki yeni oturumu da düşürüyordu)
    await supabase.auth.signOut({ scope: "local" });
    cookieStore.delete(CIHAZ_COOKIE);
    return Response.json({ aktif: false });
  }

  if (sonuc.deviceId !== deviceId) {
    // Özellik öncesi oturum ilk kez kaydedildi — çerezi yaz
    cookieStore.set(CIHAZ_COOKIE, sonuc.deviceId, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, path: "/",
    });
  }
  return Response.json({ aktif: true });
}

export async function DELETE(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum gerekli" }, { status: 401 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return Response.json({ error: "Cihaz id gerekli" }, { status: 400 });

  const ok = await cihazDusur(user.id, body.id);
  if (!ok) return Response.json({ error: "Oturum sonlandırılamadı" }, { status: 500 });
  return Response.json({ ok: true });
}
