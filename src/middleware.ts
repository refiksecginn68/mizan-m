import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AVUKAT_ROUTES = ["/buro"];
const VATANDAS_ROUTES = ["/panel", "/asistan", "/belgelerim", "/uretilen-belgeler", "/emsal", "/kredi", "/uyap"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Statik dosyalar için atla
  if (pathname.startsWith("/_next/") || pathname.includes(".")) {
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
    return NextResponse.redirect(url);
  }

  // Avukat rotasına vatandaş → /panel
  if (user && AVUKAT_ROUTES.some((r) => pathname.startsWith(r))) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profile && profile.user_type === "vatandas") {
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
