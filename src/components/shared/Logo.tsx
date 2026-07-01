"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  href?: string;
  size?: number;
  showText?: boolean;
  textClass?: string;
  subtitle?: string;
  className?: string;
}

export default function Logo({
  href,
  size = 28,
  showText = true,
  textClass = "font-heading text-base font-bold text-white",
  subtitle,
  className = "",
}: LogoProps) {
  const inner = (
    <span className={`flex items-center gap-2 ${className}`}>
      <span
        className="rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Mizanım"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </span>
      {showText && (
        <span>
          <span className={textClass}>Mizanım</span>
          {subtitle && (
            <span className="font-body text-xs text-white/40 ml-1.5">{subtitle}</span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
