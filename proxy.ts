/**
 * Route guard middleware  (middleware.ts — Next.js requires this exact filename)
 *
 * Protected routes  → require a valid signed session cookie
 * Auth routes       → redirect to /home if already signed in
 * Everything else   → pass through (landing page, public assets, API)
 *
 * Runs on the Edge runtime — no Node APIs, no Prisma.
 * Only the cookie signature is verified here; the DB is never hit.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";

// ── Route classification ───────────────────────────────────────────────────────

/** Paths that require an authenticated session. */
const PROTECTED_PREFIXES = ["/home", "/settings", "/teams", "/invite"];

/** Auth pages — redirect away if the user is already signed in. */
const AUTH_PREFIXES = [
  "/signIn",
  "/signUp",
  "/forgot-password",
  "/reset-password",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

// ── Middleware ─────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieHeader = request.headers.get("cookie");
  const userId = await getSessionUserIdFromCookies(cookieHeader);

  if (isProtected(pathname)) {
    if (!userId) {
      // Preserve the destination so we can redirect back after sign-in
      const signInUrl = new URL("/signIn", request.url);
      signInUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(signInUrl);
    }
    // Valid session — let the request through
    return NextResponse.next();
  }

  if (isAuthPage(pathname)) {
    if (userId) {
      // Already signed in — send to the app
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// ── Matcher ────────────────────────────────────────────────────────────────────
// Skip Next.js internals and static files; only run on actual page/API routes.

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
