/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Lock, ShieldCheck } from "lucide-react";
import EklentiBaglanti from "@/components/buro/EklentiBaglanti";
import { getTrialDurum } from "@/lib/trial";
import { EXTENSION_VERSION } from "@/lib/extension-version";

export default async function UyapAyarlarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const svc = createServiceClient() as any;
  const { data: profile } = await svc
    .from("profiles")
    .select("user_type, uyap_uets_active, trial_started_at, trial_ends_at, trial_queries_left")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "avukat") redirect("/panel");

  const trial = getTrialDurum(profile);

  // Max paketi veya aktif deneme olmayan avukata kilit ekranı
  if (!profile.uyap_uets_active && !trial.aktif) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0f1729] flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-[#c9a84c]" />
          </div>
          <h1 className="font-heading text-xl font-bold text-primary mb-2">
            UYAP/UETS Eklentisi — Avukat Max&apos;e Özel
          </h1>
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">
            Chrome eklentisi ile UYAP dosyalarınızı ve UETS tebligatlarınızı Mizanım&apos;a
            otomatik aktarma özelliği yalnızca <strong>Avukat Max</strong> paketinde sunulur.
          </p>
          <Link href="/kredi-yukle" className="btn-primary inline-block px-8">
            Max Paketine Geç
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0f1729] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#c9a84c]" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-primary">UYAP/UETS Eklenti Kurulumu</h1>
          <p className="font-body text-sm text-muted-foreground">
            mizanim-uyap-uets-v{EXTENSION_VERSION} · {profile.uyap_uets_active ? "Avukat Max paketinizde aktif" : `Deneme sürenizde aktif (${trial.kalanGun} gün kaldı)`}
          </p>
        </div>
      </div>

      <EklentiBaglanti />
    </div>
  );
}
