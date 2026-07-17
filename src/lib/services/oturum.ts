// Eşzamanlı oturum (cihaz) yönetimi — hesap paylaşımını önler.
// Girişte cihaz kaydedilir; limit aşılırsa en eski aktif cihaz düşürülür.
// Düşürülen cihaz, istemcideki OturumBekci'nin ilk kalp atışında çıkış yapar.

import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Aynı hesap aynı anda en fazla bu kadar cihazda açık kalır
export const MAX_AKTIF_CIHAZ = 1;

export const CIHAZ_COOKIE = "mizan_cihaz";

export interface CihazKaydi {
  id: string;
  device_id: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  last_seen_at: string;
}

/** Girişte çağrılır: yeni cihazı kaydeder, limit üstündeki eski cihazları düşürür. */
export async function cihazKaydet(
  userId: string,
  userAgent: string | null,
  ip: string | null
): Promise<string> {
  const svc = createServiceClient() as Any;
  const deviceId = randomUUID();

  await svc.from("user_devices").insert({
    user_id: userId,
    device_id: deviceId,
    user_agent: userAgent,
    ip,
  });

  await limitUygula(userId, svc);
  return deviceId;
}

/** Limit üstündeki en eski aktif cihazları düşürür. */
async function limitUygula(userId: string, svc: Any): Promise<void> {
  const { data: aktifler } = await svc
    .from("user_devices")
    .select("id")
    .eq("user_id", userId)
    .eq("revoked", false)
    .order("last_seen_at", { ascending: false });

  const fazlalik = (aktifler ?? []).slice(MAX_AKTIF_CIHAZ) as { id: string }[];
  if (fazlalik.length > 0) {
    await svc
      .from("user_devices")
      .update({ revoked: true })
      .in("id", fazlalik.map((f) => f.id));
  }
}

/**
 * Kalp atışı: cihaz hâlâ aktif mi? Aktifse last_seen güncellenir.
 * Cihaz kaydı hiç yoksa (özellik öncesi oturumlar) cihaz burada kaydedilir —
 * mevcut kullanıcılar bir anda dışarı atılmaz, limite dahil edilir.
 */
export async function kalpAtisi(
  userId: string,
  deviceId: string | null,
  userAgent: string | null,
  ip: string | null
): Promise<{ aktif: boolean; deviceId: string }> {
  const svc = createServiceClient() as Any;

  if (deviceId) {
    const { data: cihaz } = await svc
      .from("user_devices")
      .select("id, revoked")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .single();

    if (cihaz && !cihaz.revoked) {
      await svc
        .from("user_devices")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", cihaz.id);
      return { aktif: true, deviceId };
    }
    if (cihaz?.revoked) return { aktif: false, deviceId };
  }

  // Kayıtsız cihaz — özellik öncesi oturum: kaydet ve limiti uygula
  const yeniId = await cihazKaydet(userId, userAgent, ip);
  return { aktif: true, deviceId: yeniId };
}

/** Kullanıcının aktif cihaz listesi. */
export async function aktifCihazlar(userId: string): Promise<CihazKaydi[]> {
  const svc = createServiceClient() as Any;
  const { data } = await svc
    .from("user_devices")
    .select("id, device_id, user_agent, ip, created_at, last_seen_at")
    .eq("user_id", userId)
    .eq("revoked", false)
    .order("last_seen_at", { ascending: false });
  return (data ?? []) as CihazKaydi[];
}

/** Belirli bir cihaz oturumunu sonlandırır (kendi cihazı da olabilir). */
export async function cihazDusur(userId: string, cihazId: string): Promise<boolean> {
  const svc = createServiceClient() as Any;
  const { error } = await svc
    .from("user_devices")
    .update({ revoked: true })
    .eq("user_id", userId)
    .eq("id", cihazId);
  return !error;
}
