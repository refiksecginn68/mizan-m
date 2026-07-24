import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AVUKAT_ROUTES = ["/buro"];
const VATANDAS_ROUTES = ["/panel", "/asistan", "/belgelerim", "/uretilen-belgeler", "/emsal", "/kredi", "/uyap"];

// In-memory rate limiter: IP → { count, resetAt }
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
// Not: sayaç başarılı girişleri de sayar (middleware yanıtı göremez).
// Ofis/NAT arkasından birden çok kullanıcı aynı IP'den geleceği için limit geniş.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 dakika

// Oturum bilgisi gerektirmeyen herkese açık sayfalar — bu yollarda middleware
// Supabase auth ağ çağrısı YAPMAZ (her sayfa geçişine ~100-300ms ekliyordu).
const PUBLIC_PATHS = new Set([
  "/", "/giris", "/kayit", "/sifremi-unuttum", "/fiyatlandirma", "/ozellikler",
  "/hakkimizda", "/iletisim", "/sss", "/gizlilik", "/gizlilik-politikasi",
  "/kvkk", "/kullanim-sartlari", "/yasal-uyari", "/cerez-politikasi",
  "/mesafeli-satis-sozlesmesi", "/eklenti-gizlilik", "/oturum-suresi-doldu",
  "/dogrulama-bekliyor", "/offline", "/auth/hata",
]);

// Eski punycode domain → yeni domain kalıcı taşıma.
// DOMAIN_REDIRECT=1 olana kadar UYUTULUR (yeni domain canlı+SSL olmadan
// yönlendirme yaparsak eski kullanıcılar ölü domaine düşer). /api HARİÇ tutulur:
// eklenti Bearer token gönderir; cross-origin 301'de tarayıcı Authorization
// başlığını düşürür → 401. Eski eklenti kullanıcıları /api'yi eski domainden
// (aynı deployment) kesintisiz kullanmaya devam etsin.
const ESKI_HOSTLAR = new Set(["xn--mizanm-t9a.com", "www.xn--mizanm-t9a.com"]);
const YENI_HOST = "mizanim.com";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Domain taşıma yönlendirmesi (aktifse ve istek eski domaindense)
  if (process.env.DOMAIN_REDIRECT === "1" && !pathname.startsWith("/api/")) {
    const host = request.headers.get("host")?.toLowerCase() ?? "";
    if (ESKI_HOSTLAR.has(host)) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.host = YENI_HOST;
      url.port = "";
      return NextResponse.redirect(url, 301); // yol + query korunur
    }
  }

  // Statik dosyalar için atla
  if (pathname.startsWith("/_next/") || pathname.includes(".")) {
    return supabaseResponse;
  }

  // Login rate limiting
  if (pathname === "/api/auth/login" && request.method === "POST") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const record = loginAttempts.get(ip);
    if (record && now < record.resetAt) {
      if (record.count >= RATE_LIMIT_MAX) {
        const waitMin = Math.ceil((record.resetAt - now) / 60000);
        return NextResponse.json(
          { error: `Çok fazla başarısız giriş denemesi. ${waitMin} dakika sonra tekrar deneyin.` },
          { status: 429 }
        );
      }
      record.count += 1;
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }
  }

  // Herkese açık sayfa: auth kontrolü gereksiz — Supabase'e gitmeden geç
  if (PUBLIC_PATHS.has(pathname)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return supabaseResponse;
  }

  const isProtected =
    AVUKAT_ROUTES.some((r) => pathname.startsWith(r)) ||
    VATANDAS_ROUTES.some((r) => pathname.startsWith(r));

  // Giriş yapmamış kullanıcı korumalı rotaya → /giris
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
      });
    });
    return redirectResponse;
  }

  // Email doğrulanmamış kullanıcı korumalı rotaya → doğrulama sayfası
  // .test adresleri bypass edilir (test hesapları için)
  const isTestEmail = user?.email?.endsWith(".test") ?? false;
  if (user && isProtected && !user.email_confirmed_at && !isTestEmail) {
    const url = request.nextUrl.clone();
    url.pathname = "/dogrulama-bekliyor";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
      });
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
