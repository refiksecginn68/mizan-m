import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getAuthenticatedLawyer() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: "Oturum açmanız gerekiyor" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") {
    return { user: null, error: "Bu işlem için avukat hesabı gerekiyor" };
  }

  return { user, error: null };
}

export async function GET() {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const svc = createServiceClient() as AnyClient;
  const { data, error: dbError } = await svc
    .from("todos")
    .select("id, text, done, due_at, priority, created_at")
    .eq("lawyer_id", user.id)
    .order("created_at", { ascending: true });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ todos: data });
}

const GECERLI_ONCELIK = ["dusuk", "orta", "yuksek"];

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  let body: { text?: string; due_at?: string; priority?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "Görev metni zorunludur" }, { status: 400 });
  }

  const priority = GECERLI_ONCELIK.includes(body.priority ?? "") ? body.priority : "orta";

  const svc = createServiceClient() as AnyClient;
  const { data, error: dbError } = await svc
    .from("todos")
    .insert({
      lawyer_id: user.id,
      text: body.text.trim(),
      due_at: body.due_at || null,
      priority,
    })
    .select("id, text, done, due_at, priority, created_at")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ todo: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  let body: { id?: string; done?: boolean; priority?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  const guncelleme: Record<string, unknown> = {};
  if (typeof body.done === "boolean") guncelleme.done = body.done;
  if (GECERLI_ONCELIK.includes(body.priority ?? "")) guncelleme.priority = body.priority;
  if (Object.keys(guncelleme).length === 0) {
    return NextResponse.json({ error: "done veya priority gerekli" }, { status: 400 });
  }

  const svc = createServiceClient() as AnyClient;
  const { error: dbError } = await svc
    .from("todos")
    .update(guncelleme)
    .eq("id", body.id)
    .eq("lawyer_id", user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await getAuthenticatedLawyer();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const svc = createServiceClient() as AnyClient;
  const { error: dbError } = await svc
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("lawyer_id", user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
