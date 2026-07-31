import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import DuyuruBar, { type Duyuru } from "@/components/buro/DuyuruBar";
import BildirimlerPaneli from "@/components/buro/BildirimlerPaneli";
import BuroAnaSayfaClient from "./BuroAnaSayfaClient";
import FavorilerBlok from "@/components/buro/FavorilerBlok";
import TakvimWidget, { type TakvimEtkinlik, type SureUyari } from "@/components/buro/TakvimWidget";
import DashboardHeader from "@/components/buro/DashboardHeader";
import KotaBar from "@/components/buro/KotaBar";
import { VARSAYILAN_FAVORILER } from "@/lib/buro-favoriler";
import type { LegalNews } from "@/app/api/haberler/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function BuroPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const serviceSupabase = createServiceClient() as AnyClient;

  // Profile: session-based client (layout ile aynı yöntem)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, monthly_query_limit, monthly_query_count, additional_queries")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/panel");

  // Favoriler — 028 migration'ı uygulanmadan da kırılmasın diye AYRI/savunmacı çekilir.
  // Kolon yoksa (favRow null) varsayılan kullanılır; ana profil sorgusu etkilenmez.
  let favoriler: string[] = VARSAYILAN_FAVORILER;
  const { data: favRow } = await supabase
    .from("profiles").select("dashboard_favorites").eq("id", user.id).single();
  if (favRow?.dashboard_favorites?.length) favoriler = favRow.dashboard_favorites;

  const monthlyQueryLimit = profile.monthly_query_limit ?? 0;
  const monthlyQueryCount = profile.monthly_query_count ?? 0;
  const additionalQueries = profile.additional_queries ?? 0;
  const totalQueries = monthlyQueryLimit + additionalQueries;
  const remainingQueries = Math.max(0, totalQueries - monthlyQueryCount);

  const now = new Date();

  const [, upcomingEventsResult, newsResult, pendingPaymentsResult] = await Promise.all([
    serviceSupabase.from("cases").select("id").eq("lawyer_id", user.id).limit(1),
    serviceSupabase
      .from("calendar_events")
      .select("id, title, event_type, starts_at, location")
      .eq("lawyer_id", user.id)
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(12),
    serviceSupabase
      .from("legal_news")
      .select("id, title, source, category, published_at, is_featured")
      .order("published_at", { ascending: false })
      .limit(4)
      .then((r: AnyClient) => r)
      .catch(() => ({ data: null })),
    serviceSupabase
      .from("payments")
      .select("id, description, amount, metadata, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(50),
  ]);

  // Takvim etkinlikleri → widget
  const etkinlikler: TakvimEtkinlik[] = ((upcomingEventsResult?.data ?? []) as AnyClient[]).map((ev) => ({
    id: `ev-${ev.id}`,
    title: ev.title,
    type: ev.event_type ?? "diger",
    dateISO: ev.starts_at,
    location: ev.location,
  }));

  // Süre/Görev uyarıları → vadesine ≤7 gün kalan veya geçmiş bekleyen ödemeler
  const bugun = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const uyarilar: SureUyari[] = [];
  for (const p of ((pendingPaymentsResult?.data ?? []) as AnyClient[])) {
    if (!p.metadata?.due_date) continue;
    const due = new Date(p.metadata.due_date);
    const dueGun = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const kalan = Math.round((dueGun.getTime() - bugun.getTime()) / 86400000);
    if (kalan > 7) continue;
    uyarilar.push({
      id: p.id,
      label: `${p.metadata?.client_name ?? "Müvekkil"} — ${p.description ?? "Ödeme"}`,
      dateISO: due.toISOString(),
      gecikti: kalan < 0,
    });
  }
  uyarilar.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

  // DUYURU şeridi — güncel hukuki haberler (tablo yoksa fallback)
  const FALLBACK_NEWS: LegalNews[] = [
    { id: "f1", title: "Yargıtay HGK: Kıdem Tazminatında Ücret Kavramı Genişletildi", source: "Yargıtay HGK", category: "İş Hukuku", published_at: new Date(Date.now() - 86400000).toISOString(), is_featured: false, summary: null, source_url: null, tags: [] },
    { id: "f2", title: "Resmi Gazete: Tüketici Hakem Heyeti Sınırları Güncellendi", source: "Resmi Gazete", category: "Tüketici Hukuku", published_at: new Date(Date.now() - 2 * 86400000).toISOString(), is_featured: false, summary: null, source_url: null, tags: [] },
    { id: "f3", title: "AYM: Makul Süreyi Aşan Tutukluluk Hak İhlali", source: "Anayasa Mahkemesi", category: "Ceza Hukuku", published_at: new Date(Date.now() - 3 * 86400000).toISOString(), is_featured: false, summary: null, source_url: null, tags: [] },
    { id: "f4", title: "TBMM: Kira Artış Oranı Sınırlaması Uzatıldı", source: "TBMM", category: "Borçlar Hukuku", published_at: new Date(Date.now() - 4 * 86400000).toISOString(), is_featured: false, summary: null, source_url: null, tags: [] },
  ];
  const dashboardNews: LegalNews[] = (newsResult?.data && (newsResult.data as AnyClient[]).length > 0)
    ? (newsResult.data as LegalNews[])
    : FALLBACK_NEWS;
  const duyurular: Duyuru[] = dashboardNews.map((h) => ({
    id: h.id, kategori: h.category, text: h.title, href: "/buro/haberler",
  }));

  const firstName = profile.full_name.split(" ")[0];
  const tarih = now.toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* 1 · HEADER (imza dalgalı başlık) */}
      <div className="dash-block" style={{ animationDelay: "0ms" }}>
        <DashboardHeader firstName={firstName} tarih={tarih} />
      </div>

      <div className="px-4 sm:px-6 pb-6 space-y-5 -mt-2">
        {/* 2 · DUYURULAR */}
        <div className="dash-block" style={{ animationDelay: "60ms" }}>
          <DuyuruBar items={duyurular} />
        </div>

        {/* 3 · TAKVİM + YAPILACAKLAR */}
        <div className="dash-block grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ animationDelay: "120ms" }}>
          <TakvimWidget etkinlikler={etkinlikler} uyarilar={uyarilar} />
          <BuroAnaSayfaClient />
        </div>

        {/* 4 · HIZLI ERİŞİM */}
        <div className="dash-block" style={{ animationDelay: "180ms" }}>
          <FavorilerBlok initial={favoriler} />
        </div>

        {/* 5 · BİLDİRİMLER */}
        <div id="bildirimler" className="dash-block scroll-mt-4" style={{ animationDelay: "240ms" }}>
          <BildirimlerPaneli />
        </div>

        {/* 6 · YAPAY ZEKA KOTASI */}
        <div className="dash-block" style={{ animationDelay: "300ms" }}>
          <KotaBar remaining={remainingQueries} total={totalQueries} />
        </div>
      </div>
    </div>
  );
}
