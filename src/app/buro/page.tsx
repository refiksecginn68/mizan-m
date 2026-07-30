import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search } from "lucide-react";
import Selamlama from "@/components/buro/Selamlama";
import DuyuruBar, { type Duyuru } from "@/components/buro/DuyuruBar";
import BildirimlerPaneli from "@/components/buro/BildirimlerPaneli";
import BuroAnaSayfaClient from "./BuroAnaSayfaClient";
import FavorilerBlok from "@/components/buro/FavorilerBlok";
import TakvimWidget, { type TakvimEtkinlik, type SureUyari } from "@/components/buro/TakvimWidget";
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
      {/* Üst başlık (korunur) */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Selamlama firstName={firstName} />
            <p className="text-sm text-gray-500 mt-0.5">{tarih}</p>
          </div>
          <div className="flex items-center gap-2 bg-[#f4f5f7] border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Link href="/buro/emsal" className="flex-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Kanun, karar veya içtihat ara...
            </Link>
          </div>
        </div>
      </div>

      {/* DUYURU şeridi (korunur) */}
      <div className="px-4 sm:px-6 pt-4">
        <DuyuruBar items={duyurular} />
      </div>

      {/* 2 kolon grid — DOM sırası = mobil sıra (favoriler → takvim → kota → bildirimler → yapılacaklar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-4 sm:p-6">
        {/* Favoriler (sol, 2 kolon) */}
        <div className="lg:col-span-2">
          <FavorilerBlok initial={favoriler} />
        </div>

        {/* Takvim widget (sağ kolon, üstte) */}
        <div className="lg:col-start-3 lg:row-start-1">
          <TakvimWidget etkinlikler={etkinlikler} uyarilar={uyarilar} />
        </div>

        {/* Kota + Ek Paket (favorilerin altında) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 font-medium">Yapay Zeka Sorgu Kotası</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              Kalan Sorgu: <span className="text-[#c9a84c]">{remainingQueries}</span> / {totalQueries}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Mevzuat ve karar aramaları kotanızdan düşmez. MizanAI sohbeti ve AI analizleri dahildir.
            </p>
          </div>
          <Link
            href="/kredi"
            className="px-4 py-2 bg-[#1a2744] hover:bg-[#0f1729] text-white text-xs font-bold rounded-xl transition-all duration-300 flex-shrink-0"
          >
            Ek Paket Satın Al
          </Link>
        </div>

        {/* Bildirimler (en altta) */}
        <div className="lg:col-span-2">
          <BildirimlerPaneli />
        </div>

        {/* Yapılacaklar (sağ kolon, takvimin altında) */}
        <div className="lg:col-start-3 lg:row-start-2">
          <BuroAnaSayfaClient />
        </div>
      </div>
    </div>
  );
}
