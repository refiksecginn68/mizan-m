import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Zaten giriş yapmış kullanıcıyı dashboard'a yönlendir
  const supabase = createClient() as Any;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();
    redirect(profile?.user_type === "avukat" ? "/buro" : "/panel");
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Auth Header */}
      <header className="bg-primary py-4 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#0f1729]">
            <Image src="/logo.png" alt="Mizanım" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <span className="font-heading text-xl font-bold text-white">Mizanım</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer Note */}
      <div className="py-4 text-center">
        <p className="font-body text-xs text-muted-foreground">
          © {new Date().getFullYear()} Mizanım —{" "}
          <Link href="/gizlilik" className="hover:text-accent transition-colors">
            Gizlilik
          </Link>{" "}
          ·{" "}
          <Link href="/kullanim-sartlari" className="hover:text-accent transition-colors">
            Kullanım Şartları
          </Link>
        </p>
      </div>
    </div>
  );
}
