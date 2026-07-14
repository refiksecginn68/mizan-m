import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Hesabı kalıcı siler (KVKK silme hakkı). Onay metni zorunlu.
export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { onay?: string };
  if (body.onay !== "HESABIMI SİL") {
    return NextResponse.json({ error: "Onay metni hatalı" }, { status: 400 });
  }

  const svc = createServiceClient() as Any;
  const { error } = await svc.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[hesap/sil] kullanıcı silinemedi:", error.message);
    return NextResponse.json({ error: "Hesap silinemedi. Lütfen destek ile iletişime geçin." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
