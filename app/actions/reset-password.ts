"use server";

export async function updatePassword(
  accessToken: string,
  password: string
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Auth is not configured correctly.");
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(
      payload?.msg ??
        payload?.message ??
        payload?.error_description ??
        payload?.error ??
        "Could not update password. The link may have expired."
    );
  }
}
