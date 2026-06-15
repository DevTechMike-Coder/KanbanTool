"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Separator } from "../ui/separator";
import GoogleIcon from "../iconComp/GoogleIcon";
import GithubIcon from "../iconComp/GithubIcon";

const initialSignUpState = {
  status: "idle" as const,
};

const t = {
  cardTitle: "Sign up for an account",
  cardDescription: "Enter your details below to create an account",
  nameLabel: "Name",
  namePlaceholder: "Mighty Mike",
  emailLabel: "Email",
  emailPlaceholder: "mightymike@example.com",
  passwordLabel: "Password",
  passwordPlaceholder: "********",
  forgotPassword: "Forgot your password?",
  loginButton: "Sign Up",
  googleButton: "Google",
  githubButton: "Github",
  cardFooter: "Already have an account?",
  cardFooterLink: "SignIn",
  backToHome: "Back to home",
};

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";
  const [state, formAction, pending] = useActionState(signup, initialSignUpState);
  const [showPassword, setShowPassword] = useState(false);

  const oauthError = searchParams.get("error");

  useEffect(() => {
    if (state.status === "success") {
      router.push(redirectTo);
      router.refresh();
    }
  }, [state.status, router, redirectTo]);

  function handleGoogleSignIn() {
    const params = new URLSearchParams({ next: redirectTo });
    window.location.href = `/api/auth/google?${params.toString()}`;
  }

  function handleGithubSignIn() {
    const params = new URLSearchParams({ next: redirectTo });
    window.location.href = `/api/auth/github?${params.toString()}`;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Button
        asChild
        variant="ghost"
        className="absolute left-4 top-4 md:left-8 md:top-8"
      >
        <Link href="/">
          <ArrowLeft />
          {t.backToHome}
        </Link>
      </Button>
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <CardTitle>{t.cardTitle}</CardTitle>
          <CardDescription>{t.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">{t.nameLabel}</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder={t.namePlaceholder}
                  aria-invalid={Boolean(state.errors?.name)}
                  aria-describedby={
                    state.errors?.name ? "name-error" : undefined
                  }
                  required
                />
                {state.errors?.name && (
                  <p id="name-error" className="text-xs text-red-600">
                    {state.errors.name}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t.emailLabel}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  aria-invalid={Boolean(state.errors?.email)}
                  aria-describedby={
                    state.errors?.email ? "email-error" : undefined
                  }
                  required
                />
                {state.errors?.email && (
                  <p id="email-error" className="text-xs text-red-600">
                    {state.errors.email}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t.passwordLabel}</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t.forgotPassword}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    placeholder={t.passwordPlaceholder}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    className="pr-10"
                    aria-invalid={Boolean(state.errors?.password)}
                    aria-describedby={
                      state.errors?.password ? "password-error" : undefined
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {state.errors?.password && (
                  <p id="password-error" className="text-xs text-red-600">
                    {state.errors.password}
                  </p>
                )}
              </div>
            </div>
            {state.message && (
              <p
                className={`mt-4 text-sm ${
                  state.status === "success" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {state.message}
              </p>
            )}
            <div>
              <Button
                type="submit"
                disabled={pending}
                className="w-full mt-3 uppercase tracking-wider"
              >
                {pending ? "Creating account..." : t.loginButton}
              </Button>
            </div>

            <Separator className="my-6" />

            {oauthError && (
              <p className="mb-4 text-sm text-red-600 text-center">
                {oauthError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <GoogleIcon className="mr-2" size={18} />
                {t.googleButton}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGithubSignIn}
              >
                <GithubIcon className="mr-2" size={18} />
                {t.githubButton}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <div className="flex flex-row items-center gap-2">
            <p className="text-sm text-muted-foreground">{t.cardFooter}</p>
            <Link
              href="/signIn"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.cardFooterLink}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
