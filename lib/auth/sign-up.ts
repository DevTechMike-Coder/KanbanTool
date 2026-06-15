import { prisma } from "../prisma";
import { setSessionCookie } from "./session";

export type SignUpField = "name" | "email" | "password";

export type SignUpState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<SignUpField, string>>;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

const initialSignUpState: SignUpState = {
  status: "idle",
};

export function getInitialSignUpState() {
  return initialSignUpState;
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

function validateSignUpInput(input: SignUpInput) {
  const errors: SignUpState["errors"] = {};
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return {
    data: { name, email, password },
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

async function signUpWithSupabaseAuth(input: SignUpInput) {
  const config = getSupabaseAuthConfig();

  if ("error" in config) {
    return {
      error: config.error,
    };
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: {
        name: input.name,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    msg?: string;
    message?: string;
    user?: {
      id?: string;
      email?: string;
      user_metadata?: {
        name?: string;
      };
    };
  } | null;

  if (!response.ok) {
    return {
      error:
        payload?.msg ??
        payload?.message ??
        payload?.error ??
        "Unable to create the Supabase auth user.",
    };
  }

  const userId = payload?.user?.id;

  if (!userId) {
    return {
      error: "Supabase did not return a user id for the new account.",
    };
  }

  return {
    userId,
    email: payload.user?.email ?? input.email,
    name: payload.user?.user_metadata?.name ?? input.name,
  };
}

export async function createSignup(input: SignUpInput): Promise<SignUpState> {
  const validated = validateSignUpInput(input);

  if (!validated.isValid) {
    return {
      status: "error",
      errors: validated.errors,
      message: "Check the highlighted fields and try again.",
    };
  }

  const authResult = await signUpWithSupabaseAuth(validated.data);

  if ("error" in authResult) {
    return {
      status: "error",
      message: authResult.error,
    };
  }

  // Two-step upsert: first try matching by Supabase user id.
  // If that triggers a unique constraint on email (a stale profile row from a
  // previous partial signup exists with the same email but different id),
  // fall back to updating that row by email so both systems stay in sync.
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
    // P2002 = Prisma unique constraint violation
    const isUniqueViolation =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (!isUniqueViolation) throw err;

    // Update the conflicting row to adopt the new Supabase auth id
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
    message: "Account successfully initialized.",
  };
}

export function formDataToSignUpInput(formData: FormData): SignUpInput {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}
