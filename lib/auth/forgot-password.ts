export type ForgotPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type ResetPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function getSupabaseAuthConfig() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error:
        "Supabase auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to your environment.",
    };
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function requestPasswordReset(
  email: string
): Promise<ForgotPasswordState> {
  const trimmed = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const config = getSupabaseAuthConfig();
  if ("error" in config) {
    return { status: "error", message: config.error };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const recoverUrl = new URL(`${config.supabaseUrl}/auth/v1/recover`);
  if (appUrl) {
    recoverUrl.searchParams.set("redirect_to", `${appUrl}/reset-password`);
  }

  const response = await fetch(recoverUrl.toString(), {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: trimmed }),
  });

  // Supabase returns 200 even for unknown emails (security best practice —
  // never confirm whether an email is registered).
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const msg =
      payload?.msg ??
      payload?.message ??
      payload?.error_description ??
      payload?.error ??
      "Could not send reset email. Please try again.";
    return { status: "error", message: msg };
  }

  return {
    status: "success",
    message:
      "If that email is registered you'll receive a reset link shortly. Check your inbox (and spam folder).",
  };
}
