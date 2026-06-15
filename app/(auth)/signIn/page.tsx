import SignInForm from "@/components/auth/SignInForm"
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <main>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-muted/30">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </main>
  );
}

