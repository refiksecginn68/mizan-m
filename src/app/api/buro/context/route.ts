import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function GET() {
  try {
    const supabase = createClient() as Any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = createServiceClient() as Any;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [clients, cases, upcomingEvents, openPayments] = await Promise.all([
      svc.from("clients").select("id, full_name, phone, email", { count: "exact" })
        .eq("lawyer_id", user.id).eq("is_active", true).limit(50),
      svc.from("cases").select("id, title, status, case_number, court", { count: "exact" })
        .eq("lawyer_id", user.id).eq("status", "aktif").limit(50),
      svc.from("calendar_events").select("id, title, event_type, starts_at, location, notes, cases(title)")
        .eq("lawyer_id", user.id)
        .gte("starts_at", todayStart)
        .lte("starts_at", weekLater)
        .order("starts_at", { ascending: true })
        .limit(10),
      svc.from("payments").select("amount, description, created_at")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(20),
    ]);

    const monthlyRevenue = await svc.from("payments")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "success")
      .gte("created_at", monthStart);

    const totalRevenue = (monthlyRevenue.data as { amount: number }[] | null)
      ?.reduce((s: number, p: { amount: number }) => s + p.amount, 0) ?? 0;

    // Yapılandırılmış bağlam metni oluştur
    const lines: string[] = [
      `## AVUKAT SİSTEM VERİSİ (${now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })})`,
      "",
      `### Genel Özet`,
      `- Aktif müvekkil sayısı: ${clients.count ?? 0}`,
      `- Aktif dava sayısı: ${cases.count ?? 0}`,
      `- Bu ay tahsilat: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalRevenue)}`,
      "",
    ];

    if (upcomingEvents.data && upcomingEvents.data.length > 0) {
      lines.push("### Önümüzdeki 7 Gün — Takvim");
      for (const ev of upcomingEvents.data as Any[]) {
        const dt = new Date(ev.starts_at);
        const label = `${dt.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} ${dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
        lines.push(`- [${ev.event_type.toUpperCase()}] ${ev.title} — ${label}${ev.location ? ` (${ev.location})` : ""}${ev.cases?.title ? ` | Dava: ${ev.cases.title}` : ""}`);
      }
      lines.push("");
    } else {
      lines.push("### Takvim");
      lines.push("- Önümüzdeki 7 günde planlanmış etkinlik yok.");
      lines.push("");
    }

    if (openPayments.data && openPayments.data.length > 0) {
      lines.push("### Bekleyen Ödemeler");
      for (const p of openPayments.data as Any[]) {
        lines.push(`- ${p.description ?? "Ödeme"}: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.amount)}`);
      }
      lines.push("");
    }

    if (clients.data && clients.data.length > 0) {
      lines.push("### Aktif Müvekkil Listesi (ilk 50)");
      for (const c of clients.data as Any[]) {
        lines.push(`- ${c.full_name}${c.phone ? ` | ${c.phone}` : ""}${c.email ? ` | ${c.email}` : ""}`);
      }
      lines.push("");
    }

    if (cases.data && cases.data.length > 0) {
      lines.push("### Aktif Dava Listesi (ilk 50)");
      for (const c of cases.data as Any[]) {
        lines.push(`- ${c.title}${c.case_number ? ` | No: ${c.case_number}` : ""}${c.court ? ` | ${c.court}` : ""}`);
      }
      lines.push("");
    }

    return NextResponse.json({ context: lines.join("\n") });
  } catch (e) {
    console.error("Context fetch error:", e);
    return NextResponse.json({ context: "" });
  }
}
