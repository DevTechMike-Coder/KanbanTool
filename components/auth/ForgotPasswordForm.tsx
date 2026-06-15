"use client";

import { useActionState } from "react";
import { forgotPassword } from "@/app/actions/auth";
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
import { ArrowLeft, MailCheck } from "lucide-react";

const initialState = { status: "idle" as const };

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPassword,
    initialState,
  );

  if (state.status === "success") {
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
        <Card className="w-full max-w-sm shadow-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <MailCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline" className="w-full">
              <Link href="/signIn">Back to sign in</Link>
            </Button>
          </CardFooter>
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
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="mightymike@example.com"
                  required
                />
              </div>
            </div>
            {state.status === "error" && state.message && (
              <p className="mt-4 text-sm text-red-600">{state.message}</p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="w-full mt-4 uppercase tracking-wider"
            >
              {pending ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
