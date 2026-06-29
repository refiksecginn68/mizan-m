import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  MessageSquare,
  FileText,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  ExternalLink,
  Newspaper,
} from "lucide-react";
import BuroAnaSayfaClient from "./BuroAnaSayfaClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// Sabit demo haber verisi (gerçek API bağlanana kadar)
const HUKUKI_HABERLER = [
  {
    id: 1,
    baslik: "Yargıtay: İşçi Alacaklarında Zamanaşımı Kararı",
    kaynak: "Yargıtay 9. HD",
    tarih: "24 Haz 2026",
    url: "#",
    kategori: "İş Hukuku",
  },
  {
    id: 2,
    baslik: "Tüketici Hakem Heyeti Yetkisinde Yeni Düzenleme",
    kaynak: "Ticaret Bakanlığı",
    tarih: "23 Haz 2026",
    url: "#",
    kategori: "Tüketici",
  },
  {
    id: 3,
    baslik: "İdare Mahkemelerinde E-Tebligat Zorunluluğu Başladı",
    kaynak: "Adalet Bakanlığı",
    tarih: "22 Haz 2026",
    url: "#",
    kategori: "Usul Hukuku",
  },
  {
    id: 4,
    baslik: "Kira Artış Oranı: TÜFE Uygulaması Uzatıldı",
    kaynak: "TBMM",
    tarih: "21 Haz 2026",
    url: "#",
    kategori: "Borçlar Hukuku",
  },
];

const KATEGORI_RENK: Record<string, string> = {
  "İş Hukuku": "bg-blue-100 text-blue-700",
  "Tüketici": "bg-green-100 text-green-700",
  "Usul Hukuku": "bg-purple-100 text-purple-700",
  "Borçlar Hukuku": "bg-orange-100 text-orange-700",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  durusma: "bg-red-100 text-red-700",
  toplanti: "bg-blue-100 text-blue-700",
  sure: "bg-orange-100 text-orange-700",
  diger: "bg-gray-100 text-gray-600",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  durusma: "Duruşma",
  toplanti: "Toplantı",
  sure: "Süre",
  diger: "Diğer",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default async function BuroPage() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/panel");

  const serviceSupabase = createServiceClient() as AnyClient;
  const now = new Date();

  const [, upcomingEvents] = await Promise.all([
    serviceSupabase
      .from("cases")
      .select("id")
      .eq("lawyer_id", user.id)
      .limit(1),
    serviceSupabase
      .from("calendar_events")
      .select("id, title, event_type, starts_at, location")
      .eq("lawyer_id", user.id)
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(5),
  ]);

  const firstName = profile.full_name.split(" ")[0];
  const tarih = now.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* Üst başlık */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0f1729]">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{tarih}</p>
          </div>
          {/* Arama çubuğu */}
          <div className="flex items-center gap-2 bg-[#f4f5f7] border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Link href="/buro/emsal" className="flex-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Kanun, karar veya içtihat ara...
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Sol + Orta */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* 2 Büyük Kart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/buro/asistan"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2744] to-[#0f1729] p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-1">MizanAI Hukuki Sohbet</h3>
                <p className="text-xs text-white/50 leading-relaxed mb-4">
                  Davaları, müvekkilleri ve takvimi bilen yapay zeka asistanınız
                </p>
                <span className="inline-flex items-center gap-1.5 bg-[#c9a84c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg group-hover:bg-[#e7b743] transition-colors">
                  Sohbet Başlat <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            <Link
              href="/buro/dilekce"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-1">AI Dilekçe Oluştur</h3>
                <p className="text-xs text-white/60 leading-relaxed mb-4">
                  Emsal kararlarla desteklenmiş profesyonel dilekçe hazırlama
                </p>
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                  Dilekçe Oluştur <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>

          {/* Son Mevzuatlar + Emsal Kararlar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Son Eklenen Mevzuatlar */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="font-heading text-sm font-bold text-[#0f1729]">Son Eklenen Mevzuatlar</h2>
                <Link href="/buro/mevzuat" className="text-xs text-[#c9a84c] hover:underline font-medium">
                  Tümü
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { no: "7511", ad: "Türk Medeni Kanunu - Güncel", tarih: "Jun 2026" },
                  { no: "6098", ad: "Türk Borçlar Kanunu", tarih: "May 2026" },
                  { no: "4857", ad: "İş Kanunu Tebliğ Değişikliği", tarih: "May 2026" },
                  { no: "2577", ad: "İdari Yargılama Usulü Kanunu", tarih: "Apr 2026" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-[#1a2744]/8 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#1a2744]/60">{m.no.slice(0, 4)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate group-hover:text-[#1a2744]">{m.ad}</p>
                      <p className="text-[10px] text-gray-400">{m.tarih}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#c9a84c] transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Son Eklenen Emsal Kararlar */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="font-heading text-sm font-bold text-[#0f1729]">Son Eklenen Emsal Kararlar</h2>
                <Link href="/buro/emsal" className="text-xs text-[#c9a84c] hover:underline font-medium">
                  Tümü
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { mahkeme: "Yargıtay 9. HD", esas: "2024/1234", konu: "İşçi Alacakları - Kıdem Tazminatı" },
                  { mahkeme: "Danıştay 12. D.", esas: "2024/4471", konu: "İdari Para Cezası İptali" },
                  { mahkeme: "Yargıtay 4. HD", esas: "2024/8821", konu: "Manevi Tazminat Miktarı" },
                  { mahkeme: "Bölge AYİM", esas: "2024/2219", konu: "Askerlik Erteleme Kararı" },
                ].map((k, i) => (
                  <Link key={i} href="/buro/emsal" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#c9a84c]">K</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate group-hover:text-[#1a2744]">{k.konu}</p>
                      <p className="text-[10px] text-gray-400">{k.mahkeme} · {k.esas}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#c9a84c] transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Güncel Hukuki Haberler */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <Newspaper className="w-4 h-4 text-[#c9a84c]" />
              <h2 className="font-heading text-sm font-bold text-[#0f1729]">Güncel Hukuki Haberler</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
              {HUKUKI_HABERLER.map((haber) => (
                <div key={haber.id} className="px-5 py-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${KATEGORI_RENK[haber.kategori] ?? "bg-gray-100 text-gray-600"}`}>
                      {haber.kategori}
                    </span>
                    <span className="text-[10px] text-gray-400">{haber.tarih}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-800 group-hover:text-[#1a2744] leading-relaxed">{haber.baslik}</p>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <ExternalLink className="w-2.5 h-2.5" />
                    {haber.kaynak}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Sağ Kolon */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-4">

          {/* Yaklaşan Duruşmalar */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <h2 className="font-heading text-sm font-bold text-[#0f1729]">Yaklaşan Duruşmalar</h2>
              <Link href="/buro/takvim" className="text-xs text-[#c9a84c] hover:underline font-medium">
                Takvim
              </Link>
            </div>
            <div className="p-2">
              {!upcomingEvents.data || (upcomingEvents.data as AnyClient[]).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400">Yaklaşan etkinlik yok</p>
                  <Link href="/buro/takvim" className="text-xs text-[#c9a84c] hover:underline mt-1 block">
                    Etkinlik ekle →
                  </Link>
                </div>
              ) : (
                (upcomingEvents.data as AnyClient[]).map((ev) => {
                  const typeColor = EVENT_TYPE_COLORS[ev.event_type] || EVENT_TYPE_COLORS.diger;
                  const typeLabel = EVENT_TYPE_LABELS[ev.event_type] || "Diğer";
                  const evDate = new Date(ev.starts_at);
                  return (
                    <div key={ev.id} className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 text-center bg-[#0f1729] rounded-xl w-10 py-1.5">
                        <p className="text-[10px] font-bold text-[#c9a84c]">
                          {evDate.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase()}
                        </p>
                        <p className="text-sm font-bold text-white leading-none">
                          {evDate.getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{ev.title}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {evDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          {ev.location && (
                            <>
                              <MapPin className="w-2.5 h-2.5 ml-1" />
                              <span className="truncate">{ev.location}</span>
                            </>
                          )}
                        </p>
                        <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${typeColor}`}>
                          {typeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Yapılacaklar */}
          <BuroAnaSayfaClient />

        </div>
      </div>
    </div>
  );
}
