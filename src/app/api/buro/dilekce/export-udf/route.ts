import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function POST(request: Request) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { metin, baslik } = await request.json() as { metin: string; baslik: string };

  const now = new Date().toISOString();
  const udf = `<?xml version="1.0" encoding="UTF-8"?>
<UDF xmlns="urn:uyap:udf:v2" version="2.0">
  <Metadata>
    <Baslik>${baslik || "Dilekçe"}</Baslik>
    <BelgeTuru>DILEKCE</BelgeTuru>
    <OlusturmaTarihi>${now}</OlusturmaTarihi>
    <Platform>Mizanim</Platform>
  </Metadata>
  <Icerik>
    <Metin><![CDATA[${metin}]]></Metin>
  </Icerik>
</UDF>`;

  const encoder = new TextEncoder();
  const bytes = encoder.encode(udf);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Content-Disposition": `attachment; filename="dilekce.udf"`,
    },
  });
}
