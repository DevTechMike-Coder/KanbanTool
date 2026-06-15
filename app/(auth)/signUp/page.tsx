import SignUpForm from "@/components/auth/SignUpForm";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <main>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-muted/30">Loading...</div>}>
        <SignUpForm />
      </Suspense>
    </main>
  );
}
