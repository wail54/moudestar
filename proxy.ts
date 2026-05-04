import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Proxy Next.js 16 — protège /admin/* et gère la session Supabase.
 *
 * Règles :
 * - /admin/** → réservé aux utilisateurs avec role ADMIN dans user_metadata
 * - /login    → redirige vers /admin si déjà connecté en admin
 */
export async function proxy(request: NextRequest) {
  // Réponse initiale (sera modifiée si les cookies de session changent)
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  // Client Supabase pour middleware — créé inline (pattern officiel)
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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
    },
  );

  // IMPORTANT : getUser() rafraîchit le token si nécessaire.
  // Ne pas remplacer par getSession() — moins sécurisé.
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ─── Protection /admin ─────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = user.user_metadata?.role as string | undefined;
    if (role !== "ADMIN") {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
  }

  // ─── /login : déjà admin → vers /admin ────────────────────────────────────
  if (pathname === "/login") {
    const role = user?.user_metadata?.role as string | undefined;
    if (role === "ADMIN") {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      return NextResponse.redirect(adminUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
