"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { updatePassword } from "@/app/actions/reset-password";

type Status = "loading" | "ready" | "submitting" | "success" | "error" | "invalid";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Supabase puts the recovery token in the URL hash:
  // /reset-password#access_token=...&type=recovery
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    const type = params.get("type");

    // Defer state updates to avoid synchronous setState inside useEffect body
    setTimeout(() => {
      if (token && type === "recovery") {
        setAccessToken(token);
        setStatus("ready");
        // Clean the token from the URL bar without a navigation
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        setStatus("invalid");
      }
    }, 0);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords don't match.");
      return;
    }
    if (!accessToken) return;

    setStatus("submitting");

    try {
      await updatePassword(accessToken, password);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("ready");
      return;
    }
    setTimeout(() => router.push("/signIn?reset=1"), 2500);
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-sm shadow-sm text-center">
          <CardHeader>
            <CardTitle>Invalid or expired link</CardTitle>
            <CardDescription>
              This reset link is missing or has already been used. Request a new
              one from the sign-in page.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-sm shadow-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle>Password updated</CardTitle>
            <CardDescription>
              Your password has been changed. Redirecting you to sign in…
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Button
        asChild
        variant="ghost"
        className="absolute left-4 top-4 md:left-8 md:top-8"
      >
        <Link href="/signIn">
          <ArrowLeft />
          Back to sign in
        </Link>
      </Button>
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
            {errorMsg && (
              <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
            )}
            <Button
              type="submit"
              disabled={status === "submitting"}
              className="w-full mt-4 uppercase tracking-wider"
            >
              {status === "submitting" ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
