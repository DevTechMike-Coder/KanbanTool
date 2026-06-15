import { NextRequest, NextResponse } from "next/server";
import { generatePKCE, buildAuthorizeUrl } from "@/lib/auth/oauth";

const VERIFIER_COOKIE = "oauth_verifier";
const REDIRECT_COOKIE = "oauth_redirect";
const COOKIE_MAX_AGE = 60 * 10; // 10 min

export async function GET(request: NextRequest) {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse("OAuth not configured.", { status: 500 });
  }

  const { verifier, challenge } = await generatePKCE();
  const nextParam = request.nextUrl.searchParams.get("next") ?? "/home";

  const authorizeUrl = buildAuthorizeUrl({
    supabaseUrl,
    supabaseAnonKey,
    codeChallenge: challenge,
    redirectTo: `${appUrl}/api/auth/callback`,
    provider: "google",
  });

  const response = NextResponse.redirect(authorizeUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };

  response.cookies.set(VERIFIER_COOKIE, verifier, cookieOptions);
  response.cookies.set(REDIRECT_COOKIE, nextParam, cookieOptions);
  return response;
}
