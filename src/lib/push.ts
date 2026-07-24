/* eslint-disable @typescript-eslint/no-explicit-any */
import webpush from "web-push";
import { createServiceClient } from "./supabase/server";

let vapidKeysSet = false;

function setVapid() {
  if (vapidKeysSet) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      "mailto:destek@mizanim.com",
      publicKey,
      privateKey
    );
    vapidKeysSet = true;
  } else {
    console.error("VAPID keys are missing in env!");
  }
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const svc = createServiceClient() as any;

  // Profilden push bildirimlerinin açık olup olmadığını kontrol et
  const { data: profile } = await svc
    .from("profiles")
    .select("push_enabled")
    .eq("id", userId)
    .single();

  if (!profile || profile.push_enabled === false) {
    return;
  }

  // Aktif cihaz aboneliklerini al
  const { data: subscriptions } = await svc
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  setVapid();

  const payloadString = JSON.stringify(payload);

  const promises = subscriptions.map(async (sub: any) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, payloadString);
    } catch (error: any) {
      // 404 (Not Found) veya 410 (Gone) -> abonelik sonlanmış, tablodan sil
      if (error.statusCode === 404 || error.statusCode === 410) {
        await svc.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("Push notification error endpoint:", sub.endpoint, error);
      }
    }
  });

  await Promise.all(promises);
}
