"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

function HataIcerigi() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const isExpired = reason === "expired";

  return (
    <div className="w-full max-w-md text-center animate-slide-up">
      <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-5">
        <AlertCircle className="w-10 h-10 text-danger" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-primary mb-3">
        {isExpired ? "Bağlantı Süresi Doldu" : "Geçersiz Bağlantı"}
      </h1>
      <p className="font-body text-muted-foreground leading-relaxed mb-8">
        {isExpired
          ? "Doğrulama bağlantınızın süresi dolmuş. Lütfen yeni bir doğrulama e-postası isteyin."
          : "Bu doğrulama bağlantısı geçersiz veya daha önce kullanılmış. Lütfen tekrar deneyin."}
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/dogrulama-bekliyor" className="btn-primary w-full text-center">
          Yeni Doğrulama E-postası İste
        </Link>
        <Link href="/giris" className="btn-outline w-full text-center">
          Giriş Sayfasına Dön
        </Link>
      </div>
    </div>
  );
}

export default function AuthHataPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary py-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/logo.png" alt="Mizanım" width={32} height={32} className="w-full h-full object-contain" />
          </div>
          <span className="font-heading text-xl font-bold text-white">Mizanım</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="animate-pulse font-body text-muted-foreground">Yükleniyor...</div>}>
          <HataIcerigi />
        </Suspense>
      </main>
    </div>
  );
}
