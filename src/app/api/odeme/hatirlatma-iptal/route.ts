import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Kullanıcı kendi aylık havale hatırlatmalarını kapatır
export async function POST() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const svc = createServiceClient() as Any;
  const { error } = await svc
    .from("payment_reminders")
    .update({ active: false })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  return NextResponse.json({ success: true });
}
