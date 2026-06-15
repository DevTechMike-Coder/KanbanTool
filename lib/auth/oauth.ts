/**
 * OAuth via Supabase Auth — PKCE flow
 * Supports: google | github
 */

import { prisma } from "@/lib/prisma";

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function base64urlEncode(buf: ArrayBuffer): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function generatePKCE(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64urlEncode(verifierBytes.buffer as ArrayBuffer);

  const challengeBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = base64urlEncode(challengeBytes);

  return { verifier, challenge };
}

// ── Authorize URL ─────────────────────────────────────────────────────────────

export function buildAuthorizeUrl({
  supabaseUrl,
  supabaseAnonKey,
  codeChallenge,
  redirectTo,
  provider = "google",
}: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  codeChallenge: string;
  redirectTo: string;
  provider?: "google" | "github";
}): string {
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo,
    code_challenge: codeChallenge,
    code_challenge_method: "s256",
    flow_type: "pkce",
    apikey: supabaseAnonKey,
  });

  return `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;
}

// ── Token exchange ────────────────────────────────────────────────────────────

export type OAuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export async function exchangeCodeForUser({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}): Promise<{ user: OAuthUser } | { error: string }> {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: "Supabase env vars not configured." };
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier }),
  });

  const payload = (await res.json().catch(() => null)) as {
    error?: string;
    error_description?: string;
    user?: {
      id?: string;
      email?: string;
      user_metadata?: {
        full_name?: string;
        name?: string;
        user_name?: string;   // GitHub
        avatar_url?: string;
        picture?: string;
      };
    };
  } | null;

  if (!res.ok || !payload) {
    return {
      error:
        payload?.error_description ??
        payload?.error ??
        "Failed to exchange OAuth code.",
    };
  }

  const userId = payload.user?.id;
  const email = payload.user?.email;

  if (!userId || !email) {
    return { error: "Supabase did not return a valid user." };
  }

  const meta = payload.user?.user_metadata ?? {};
  // GitHub returns user_name, Google returns full_name — handle both
  const name =
    meta.full_name ?? meta.name ?? meta.user_name ?? email.split("@")[0];
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;

  return { user: { id: userId, email, name, avatarUrl } };
}

// ── Prisma profile sync ───────────────────────────────────────────────────────

export async function upsertOAuthProfile(user: OAuthUser): Promise<void> {
  try {
    await prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      update: {
        email: user.email,
        name: user.name,
        ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      },
    });
  } catch (err: unknown) {
    // P2002 — email already exists under a different id (email+password user now using OAuth)
    const isUniqueViolation =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (!isUniqueViolation) throw err;

    await prisma.profile.update({
      where: { email: user.email },
      data: {
        id: user.id,
        name: user.name,
        ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      },
    });
  }
}
