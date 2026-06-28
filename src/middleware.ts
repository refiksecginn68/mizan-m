import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AVUKAT_ROUTES = ["/buro"];
const VATANDAS_ROUTES = ["/panel", "/asistan", "/belgelerim", "/uretilen-belgeler", "/emsal", "/kredi"];
const AUTH_ROUTES = ["/giris", "/kayit"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Statik dosyalar için middleware'i doğrudan atla
  if (
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
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
    // Supabase bağlantı hatası — auth olmadan devam et
    return supabaseResponse;
  }

  // Giriş yapmamış kullanıcı korumalı rotaya erişmeye çalışıyor
  const isProtected =
    AVUKAT_ROUTES.some((r) => pathname.startsWith(r)) ||
    VATANDAS_ROUTES.some((r) => pathname.startsWith(r));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Giriş yapmış kullanıcı auth sayfasına gitmeye çalışıyor
  if (user && AUTH_ROUTES.includes(pathname)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = profile?.user_type === "avukat" ? "/buro" : "/panel";
    return NextResponse.redirect(url);
  }

  // Avukat rotasına vatandaş girmeye çalışıyor
  if (user && AVUKAT_ROUTES.some((r) => pathname.startsWith(r))) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profile?.user_type !== "avukat") {
      const url = request.nextUrl.clone();
      url.pathname = "/panel";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
