import { createClient } from "@/lib/supabase/server";
import { EXTENSION_VERSION, EXTENSION_ZIP_BASE64 } from "@/lib/extension-zip";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Eklenti zip'i yalnızca oturum açmış avukatlara servis edilir.
// Public statik dosya olarak SUNULMAZ — üyelik şartı korunur.
export async function GET() {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") {
    return Response.json({ error: "Bu indirme sadece avukat üyelere açıktır" }, { status: 403 });
  }

  const zip = Buffer.from(EXTENSION_ZIP_BASE64, "base64");
  return new Response(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="mizanim-uyap-v${EXTENSION_VERSION}.zip"`,
      "Content-Length": String(zip.length),
      "Cache-Control": "private, no-store",
    },
  });
}
