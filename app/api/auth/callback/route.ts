/**
 * GET /api/auth/callback
 * Supabase redirects here after Google or GitHub OAuth approval.
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForUser, upsertOAuthProfile } from "@/lib/auth/oauth";
import { setSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const VERIFIER_COOKIE = "oauth_verifier";
const REDIRECT_COOKIE = "oauth_redirect";

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set(VERIFIER_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(REDIRECT_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { searchParams } = request.nextUrl;

  const oauthError = searchParams.get("error");
  if (oauthError) {
    const desc = searchParams.get("error_description") ?? oauthError;
    const url = new URL("/signIn", appUrl);
    url.searchParams.set("error", desc);
    const res = NextResponse.redirect(url);
    clearOAuthCookies(res);
    return res;
  }

  const code = searchParams.get("code");
  if (!code) {
    const res = NextResponse.redirect(new URL("/signIn", appUrl));
    clearOAuthCookies(res);
    return res;
  }

  const codeVerifier = request.cookies.get(VERIFIER_COOKIE)?.value;
  const redirectTo = request.cookies.get(REDIRECT_COOKIE)?.value ?? "/home";

  if (!codeVerifier) {
    const url = new URL("/signIn", appUrl);
    url.searchParams.set("error", "OAuth session expired. Please try again.");
    const res = NextResponse.redirect(url);
    clearOAuthCookies(res);
    return res;
  }

  const result = await exchangeCodeForUser({ code, codeVerifier });

  if ("error" in result) {
    const url = new URL("/signIn", appUrl);
    url.searchParams.set("error", result.error);
    const res = NextResponse.redirect(url);
    clearOAuthCookies(res);
    return res;
  }

  try {
    await upsertOAuthProfile(result.user);
  } catch (err) {
    console.error("[oauth callback] profile upsert failed:", err);
    const url = new URL("/signIn", appUrl);
    url.searchParams.set("error", "Account setup failed. Please try again.");
    const res = NextResponse.redirect(url);
    clearOAuthCookies(res);
    return res;
  }

  await setSessionCookie(result.user.id);

  // Guard against open redirect
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/home";

  const res = NextResponse.redirect(new URL(safeRedirect, appUrl));
  clearOAuthCookies(res);
  return res;
}
