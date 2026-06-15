"use server";

import {
  createSignup,
  formDataToSignUpInput,
  type SignUpState,
} from "@/lib/auth/sign-up";

import {
  createSignin,
  formDataToSignInInput,
  type SignInState,
} from "@/lib/auth/sign-in";

import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/lib/auth/forgot-password";

import { clearSessionCookie } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/auth/rate-limit";
import { headers } from "next/headers";

async function getClientIp(): Promise<string> {
  try {
    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
  } catch {
    // Ignore outside request context (e.g. tests)
  }
  return "127.0.0.1";
}

export async function signup(
  _state: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  if (process.env.NODE_ENV !== "production" && process.env.TEST_USER_ID) {
    // Bypass rate limiting in integration tests
  } else {
    const ip = await getClientIp();
    const limitKey = `rate:auth:${ip}`;
    const check = await rateLimit(limitKey, 5, 60000);
    if (!check.success) {
      return {
        status: "error",
        message: "Too many authentication attempts. Please try again in a minute.",
      };
    }
  }
  return createSignup(formDataToSignUpInput(formData));
}

export async function signin(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (process.env.NODE_ENV !== "production" && process.env.TEST_USER_ID) {
    // Bypass rate limiting in integration tests
  } else {
    const ip = await getClientIp();
    const limitKey = `rate:auth:${ip}`;
    const check = await rateLimit(limitKey, 5, 60000);
    if (!check.success) {
      return {
        status: "error",
        message: "Too many authentication attempts. Please try again in a minute.",
      };
    }
  }
  return createSignin(formDataToSignInInput(formData));
}

export async function forgotPassword(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  if (process.env.NODE_ENV !== "production" && process.env.TEST_USER_ID) {
    // Bypass rate limiting in integration tests
  } else {
    const ip = await getClientIp();
    const limitKey = `rate:auth:${ip}`;
    const check = await rateLimit(limitKey, 5, 60000);
    if (!check.success) {
      return {
        status: "error",
        message: "Too many authentication attempts. Please try again in a minute.",
      };
    }
  }
  const email = String(formData.get("email") ?? "");
  return requestPasswordReset(email);
}

export async function logout() {
  await clearSessionCookie();
  redirect("/signIn");
}
