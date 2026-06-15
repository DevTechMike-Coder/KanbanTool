import { prisma } from "../prisma";
import { setSessionCookie } from "./session";

export type SignInField = "email" | "password";

export type SignInState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<SignInField, string>>;
};

export type SignInInput = {
  email: string;
  password: string;
};

const initialSignInState: SignInState = {
  status: "idle",
};

export function getInitialSignInState() {
  return initialSignInState;
}

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

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

function validateSignInInput(input: SignInInput) {
  const errors: SignInState["errors"] = {};
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return {
    data: { email, password },
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

async function signInWithSupabaseAuth(input: SignInInput) {
  const config = getSupabaseAuthConfig();

  if ("error" in config) {
    return {
      error: config.error,
    };
  }

  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    error_description?: string;
    msg?: string;
    message?: string;
    user?: {
      id?: string;
      email?: string;
      user_metadata?: {
        name?: string;
      };
    };
    access_token?: string;
  } | null;

  if (!response.ok) {
    return {
      error:
        payload?.error_description ??
        payload?.msg ??
        payload?.message ??
        payload?.error ??
        "Invalid credentials or sign in failed.",
    };
  }

  const userId = payload?.user?.id;

  if (!userId) {
    return {
      error: "Supabase did not return a user id for this account.",
    };
  }

  return {
    userId,
    email: payload.user?.email ?? input.email,
    name: payload.user?.user_metadata?.name ?? "User",
  };
}

export async function createSignin(input: SignInInput): Promise<SignInState> {
  const validated = validateSignInInput(input);

  if (!validated.isValid) {
    return {
      status: "error",
      errors: validated.errors,
      message: "Check the highlighted fields and try again.",
    };
  }

  const authResult = await signInWithSupabaseAuth(validated.data);

  if ("error" in authResult) {
    return {
      status: "error",
      message: authResult.error,
    };
  }

  // Database verification: Verify profile exists in Prisma database.
  // We upsert the profile here to ensure it exists.
  try {
    await prisma.profile.upsert({
      where: { id: authResult.userId },
      create: {
        id: authResult.userId,
        email: authResult.email,
        name: authResult.name,
      },
      update: {
        email: authResult.email,
        name: authResult.name,
      },
    });
  } catch (err: unknown) {
    // P2002 = unique constraint violation
    const isUniqueViolation =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (!isUniqueViolation) throw err;

    // A stale profile exists with this email but a different id — re-sync it
    await prisma.profile.update({
      where: { email: authResult.email },
      data: {
        id: authResult.userId,
        name: authResult.name,
      },
    });
  }

  await setSessionCookie(authResult.userId);

  return {
    status: "success",
    message: "Access authorized. Session successfully initialized.",
  };
}

export function formDataToSignInInput(formData: FormData): SignInInput {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}
