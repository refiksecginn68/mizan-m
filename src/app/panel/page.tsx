import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/actions/auth";
import {
  MessageSquare,
  FileText,
  Search,
  Scale,
  CreditCard,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";

export default async function PanelPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, credit_balance")
    .eq("id", user.id)
    .single() as { data: { full_name: string; user_type: string; credit_balance: number } | null };

  if (!profile || profile.user_type !== "vatandas") redirect("/buro");

  const quickActions = [
    { href: "/asistan", icon: MessageSquare, label: "AI Asistan", desc: "Hukuki sorunuzu sorun", cost: "1 kredi" },
    { href: "/belgelerim", icon: FileText, label: "Belge Analizi", desc: "Belge veya sözleşme yükleyin", cost: "5 kredi" },
    { href: "/emsal", icon: Search, label: "Emsal Arama", desc: "Mahkeme kararlarında arayın", cost: "3 kredi" },
    { href: "/uretilen-belgeler", icon: Scale, label: "Dilekçe Üret", desc: "Dilekçe veya ihtarname oluşturun", cost: "8 kredi" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="bg-primary shadow-elevated">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-white">Mizanım</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Kredi Bakiyesi */}
            <Link
              href="/kredi"
              className="flex items-center gap-2 bg-accent/20 border border-accent/40 rounded-lg px-3 py-1.5 hover:bg-accent/30 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-accent" />
              <span className="font-body text-sm font-bold text-accent">
                {profile.credit_balance} kredi
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-white/60" />
              <span className="font-body text-sm text-white/80 hidden sm:block">
                {profile.full_name}
              </span>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="text-white/60 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-primary">
            Merhaba, {profile.full_name.split(" ")[0]} 👋
          </h1>
          <p className="font-body text-muted-foreground mt-1">
            Hukuki sürecinizde yardımcı olmaya hazırız.
          </p>
        </div>

        {/* Kredi Uyarısı */}
        {profile.credit_balance < 5 && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-body text-sm font-semibold text-primary">
                Krediniz azalıyor ({profile.credit_balance} kredi kaldı)
              </p>
              <p className="font-body text-xs text-muted-foreground">Daha fazla işlem yapabilmek için kredi satın alın.</p>
            </div>
            <Link href="/kredi" className="btn-accent text-sm py-2 px-4">
              Kredi Al
            </Link>
          </div>
        )}

        {/* Hızlı İşlemler */}
        <h2 className="font-heading text-lg font-bold text-primary mb-4">Ne yapmak istersiniz?</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-4 group"
              >
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-base font-bold text-primary">{action.label}</h3>
                    <span className="legal-citation text-xs">{action.cost}</span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mt-0.5">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Yasal Uyarı */}
        <div className="bg-muted rounded-xl p-4 border border-border">
          <p className="font-body text-xs text-muted-foreground text-center">
            ⚠️ Mizanım hukuki bilgi sunar, hukuki tavsiye niteliği taşımaz.
            Hukuki durumunuz için bir avukata danışmanız önerilir.
          </p>
        </div>
      </main>
    </div>
  );
}
