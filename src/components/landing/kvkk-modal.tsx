"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, Lock, EyeOff, Scale } from "lucide-react";

interface KvkkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACK_KEY = "mizanim_kvkk_ack";

interface Assurance {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}

const ASSURANCES: Assurance[] = [
  {
    icon: Lock,
    title: "Giriş bilgileriniz saklanmaz.",
    body: "E-posta ve parolanız sistemimizde açık biçimde tutulmaz; kimlik doğrulama şifrelenmiş oturum üzerinden yapılır.",
  },
  {
    icon: EyeOff,
    title: "Müvekkil verileriniz model eğitiminde kullanılmaz.",
    body: "Yüklediğiniz dosya, dilekçe ve dava bilgileri hiçbir yapay zekâ modelinin eğitimine dahil edilmez.",
  },
  {
    icon: ShieldCheck,
    title: "Üçüncü taraflarla paylaşılmaz.",
    body: "Verileriniz ticari amaçla aktarılmaz, satılmaz.",
  },
  {
    icon: Scale,
    title: "Yasal çerçeve.",
    body: "Tüm işlemler 6698 sayılı KVKK ve Avukatlık Kanunu m.36 (sır saklama yükümlülüğü) çerçevesinde yürütülür.",
  },
];

// Avukat girişi öncesi KVKK bilgilendirme modalı.
// Kabul edilmeden /giris'e yönlendirme yapılmaz; kabul localStorage'da hatırlanır.
export default function KvkkModal({ open, onOpenChange }: KvkkModalProps) {
  const router = useRouter();

  const goToLogin = useCallback(() => {
    onOpenChange(false);
    router.push("/giris?role=avukat");
  }, [onOpenChange, router]);

  // Daha önce kabul edildiyse modalı hiç göstermeden doğrudan girişe git
  const [skipChecked, setSkipChecked] = useState(false);
  useEffect(() => {
    if (!open) {
      setSkipChecked(false);
      return;
    }
    if (localStorage.getItem(ACK_KEY) === "1") {
      goToLogin();
    } else {
      setSkipChecked(true);
    }
  }, [open, goToLogin]);

  function accept() {
    localStorage.setItem(ACK_KEY, "1");
    goToLogin();
  }

  return (
    <Dialog.Root open={open && skipChecked} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-navy-950/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-navy-800 border border-navy-700 shadow-2xl focus:outline-none data-[state=open]:animate-slide-up"
          aria-describedby="kvkk-modal-aciklama"
        >
          {/* Altın üst çizgi */}
          <div aria-hidden className="h-0.5 w-full bg-gold-500 rounded-t-2xl" />

          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <span className="relative w-14 h-14 rounded-xl overflow-hidden bg-navy-900 ring-1 ring-navy-700 mb-4">
                <Image src="/images/logo.png" alt="Mizanım logosu" fill sizes="56px" className="object-cover" />
              </span>
              <Dialog.Title className="font-heading text-2xl font-bold text-cream">
                Avukat Portalına Giriş
              </Dialog.Title>
              <Dialog.Description id="kvkk-modal-aciklama" className="font-inter text-sm text-cream/60 mt-2 leading-relaxed">
                Mizanım, meslek sırrı ve müvekkil mahremiyetini esas alır. Giriş yapmadan önce lütfen okuyunuz.
              </Dialog.Description>
            </div>

            <ul className="space-y-4 mb-6">
              {ASSURANCES.map((a) => (
                <li key={a.title} className="flex gap-3">
                  <a.icon aria-hidden className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                  <p className="font-inter text-sm text-cream/80 leading-relaxed">
                    <strong className="text-cream font-semibold">{a.title}</strong>{" "}
                    {a.body}
                  </p>
                </li>
              ))}
            </ul>

            <p className="font-inter text-xs text-cream/50 leading-relaxed border-l-2 border-gold-500/60 pl-3 mb-6">
              Veri işleme süreçlerimiz hakkında ayrıntılı bilgi almak veya bir konuda netleşmek
              isterseniz, giriş yapmadan önce bizimle iletişime geçebilirsiniz.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={accept}
                className="flex-1 py-3 rounded-md font-inter text-sm font-semibold text-navy-950 bg-gold-500 hover:bg-gold-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
              >
                Okudum, devam et
              </button>
              <Link
                href="/iletisim"
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 rounded-md font-inter text-sm text-center text-cream/80 border border-navy-700 hover:border-gold-500/50 hover:text-cream transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500"
              >
                İletişime geç
              </Link>
            </div>

            <p className="font-inter text-[11px] text-cream/55 text-center mt-4">
              Detaylı bilgi:{" "}
              <Link href="/kvkk" onClick={() => onOpenChange(false)} className="text-gold-300 hover:text-gold-100 underline underline-offset-2">
                KVKK Aydınlatma Metni
              </Link>
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
