/**
 * Session helpers
 *
 * The cookie value is a signed token: `<userId>.<base64url(HMAC-SHA256)>`
 * This prevents an attacker from forging a session by guessing or
 * enumerating user IDs, which a plain-userId cookie allows.
 *
 * Requires SESSION_SECRET in env (≥32 random chars).
 * Falls back to a dev-only secret so local dev still works, but
 * startup logs a warning so it's never silently insecure in prod.
 */

const COOKIE_NAME = "user_session";
const SEPARATOR = ".";

// ── Crypto helpers ─────────────────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET env var is required in production. " +
          "Generate one with: openssl rand -hex 32",
      );
    }
    console.warn(
      "[session] SESSION_SECRET is not set. " +
        "Using insecure dev default. Set it in .env before deploying.",
    );
    return "dev-only-insecure-secret-change-me";
  }
  return secret;
}

/**
 * Converts a Uint8Array to a base64url string using only Web APIs.
 * This is intentionally free of Node.js `Buffer` so it runs in both the
 * Node.js runtime (server actions) and the Edge runtime (middleware).
 */
function uint8ToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return uint8ToBase64url(new Uint8Array(sig));
}

async function signToken(userId: string): Promise<string> {
  const sig = await hmac(userId, getSecret());
  return `${userId}${SEPARATOR}${sig}`;
}

async function verifyToken(token: string): Promise<string | null> {
  const idx = token.lastIndexOf(SEPARATOR);
  if (idx === -1) return null;
  const userId = token.slice(0, idx);
  const givenSig = token.slice(idx + 1);
  if (!userId) return null;
  const expectedSig = await hmac(userId, getSecret());
  // Constant-time comparison to prevent timing attacks
  if (givenSig.length !== expectedSig.length) return null;
  let diff = 0;
  for (let i = 0; i < givenSig.length; i++) {
    diff |= givenSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return diff === 0 ? userId : null;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function setSessionCookie(userId: string) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = await signToken(userId);
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
  } catch {
    // Ignore when run outside Next.js server context (CLI scripts)
  }
}

export async function getSessionUserId(): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    if (process.env.NODE_ENV !== "production" && process.env.TEST_USER_ID) {
      return process.env.TEST_USER_ID;
    }
    return null;
  }
}

export async function clearSessionCookie() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Ignore
  }
}

/**
 * Edge-compatible version for use in middleware.
 * Reads the raw Cookie header rather than importing next/headers,
 * which is not available in the Edge runtime.
 */
export async function getSessionUserIdFromCookies(
  cookieHeader: string | null,
): Promise<string | null> {
  if (!cookieHeader) return null;
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!token) return null;
  return verifyToken(token);
}
