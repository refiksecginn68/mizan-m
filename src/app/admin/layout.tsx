import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, LayoutDashboard, Users, Wallet } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Admin rolü SADECE profiles.is_admin'den okunur (JWT claim/istemci değeri
// güvenilmez). Bu layout dışındaki hiçbir yerde admin yetkisi verilmez —
// veri erişimi ise RPC'lerin kendi _admin_dogrula() kontrolüyle ayrıca korunur.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/buro");

  const linkler = [
    { href: "/admin", label: "Özet", icon: LayoutDashboard },
    { href: "/admin/uyeler", label: "Üyeler", icon: Users },
    { href: "/admin/odemeler", label: "Ödemeler", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <header className="bg-[#0f1729] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 font-heading font-bold">
            <ShieldCheck className="w-5 h-5 text-[#c9a84c]" />
            Mizanım Admin
          </div>
          <nav className="flex items-center gap-1">
            {linkler.map((l) => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
                <l.icon className="w-4 h-4" /> {l.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto text-xs text-white/40">{profile.full_name}</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
