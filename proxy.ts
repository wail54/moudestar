import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Passer immédiatement si ce n'est pas une route protégée
  if (!pathname.startsWith("/admin") && pathname !== "/login") {
    return NextResponse.next({ request });
  }

  // Si les env vars Supabase ne sont pas configurées, laisser passer
  // (évite le crash si les variables sont absentes)
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[proxy] Supabase env vars missing — skipping auth check");
    return NextResponse.next({ request });
  }

  try {
    let supabaseResponse = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    });

    // getUser() rafraîchit le token si nécessaire
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ─── Protection /admin ──────────────────────────────────────────────────
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

    // ─── /login : déjà admin → vers /admin ─────────────────────────────────
    if (pathname === "/login") {
      const role = user?.user_metadata?.role as string | undefined;
      if (role === "ADMIN") {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = "/admin";
        return NextResponse.redirect(adminUrl);
      }
    }

    return supabaseResponse;
  } catch (err) {
    // En cas d'erreur Supabase inattendue, on laisse passer sans bloquer
    console.error("[proxy] Unexpected error:", err);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
