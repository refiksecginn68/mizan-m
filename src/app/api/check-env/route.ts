import { NextResponse } from "next/server";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  return NextResponse.json({
    url: {
      value: url,
      length: url.length,
    },
    serviceKey: {
      exists: serviceKey.length > 0,
      length: serviceKey.length,
      start: serviceKey.slice(0, 10),
      end: serviceKey.slice(-10),
    },
    anonKey: {
      exists: anonKey.length > 0,
      length: anonKey.length,
      start: anonKey.slice(0, 10),
      end: anonKey.slice(-10),
    },
  });
}
