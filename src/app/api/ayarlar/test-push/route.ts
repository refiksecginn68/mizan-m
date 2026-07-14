/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

export async function POST() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  await sendPushNotification(user.id, {
    title: "Mizanım Test Bildirimi",
    body: "Tebrikler! Web Push bildirimleri başarıyla çalışıyor. ⚖️🚀",
    url: "/buro",
  });

  return NextResponse.json({ success: true });
}
