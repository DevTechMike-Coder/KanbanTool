import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-muted/30">
            Loading...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
