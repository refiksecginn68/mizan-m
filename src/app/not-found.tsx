import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading text-2xl font-bold text-primary">Mizanım</span>
      </Link>

      <div className="text-center">
        <p className="font-heading text-8xl font-bold text-primary/10 mb-4 select-none">404</p>
        <h1 className="font-heading text-2xl font-bold text-primary mb-2">Sayfa Bulunamadı</h1>
        <p className="font-body text-muted-foreground mb-8 max-w-sm">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç oluşturulmamış olabilir.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-lg font-body font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
