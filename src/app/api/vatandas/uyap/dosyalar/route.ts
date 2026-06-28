import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function GET() {
  try {
    const supabase = createClient() as AnyClient;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

    const { data: files, error } = await supabase
      .from("uyap_vatandas_files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ files: files ?? [] });
  } catch (err) {
    console.error("Vatandaş UYAP dosyalar error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
