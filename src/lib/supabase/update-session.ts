import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PAGE_PATHS = ["/sign-in", "/forgot-password"] as const;

/**
 * Unauthenticated API/UI paths.
 * Swagger is allowlisted for local/dev convenience — remove before production
 * ship if the docs surface is deleted.
 */
const PUBLIC_API_PATHS = [
  "/api/health",
  "/api/docs",
  "/api/docs/spec",
] as const;

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/**
 * Refreshes the Supabase session cookie and enforces auth redirects.
 * Used from `src/proxy.ts` (Next.js 16 network boundary).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Always create a new client per request — do not cache on Fluid compute.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and supabase.auth.getClaims().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname } = request.nextUrl;

  // Authenticated users on auth pages → app home
  if (user && isPublicPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Unauthenticated — allowlisted pages/APIs pass; everything else is gated
  if (!user && !isPublicPage(pathname) && !isPublicApi(pathname)) {
    // JSON 401 for API callers (do not HTML-redirect fetch)
    if (isApiPath(pathname)) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    if (pathname !== "/" && pathname !== "/dashboard") {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
