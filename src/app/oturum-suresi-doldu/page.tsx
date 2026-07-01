import Link from "next/link";
import { Scale, Clock } from "lucide-react";

export const metadata = { title: "Oturum Süresi Doldu | Mizanım" };

export default function OturumSuresiDoldPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading text-2xl font-bold text-primary">Mizanım</span>
      </Link>

      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary mb-2">Oturumunuz Sona Erdi</h1>
        <p className="font-body text-muted-foreground mb-8 max-w-sm">
          Güvenliğiniz için oturumunuz 8 saat sonra otomatik olarak kapatıldı.
          Lütfen tekrar giriş yapın.
        </p>
        <Link
          href="/giris"
          className="btn-primary px-8 py-3 rounded-lg font-body font-semibold inline-block"
        >
          Giriş Yap
        </Link>
      </div>
    </div>
  );
}
