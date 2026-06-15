"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { LogIn, UserPlus, LayoutDashboard, X } from "lucide-react";

interface AuthPromptModalProps {
  /** If true the modal opens immediately (controlled from outside) */
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function AuthPromptModal({
  forceOpen = false,
  onClose,
}: AuthPromptModalProps) {
  const [visible, setVisible] = useState(false);

  // Initial mount delay — avoids a flash before the page renders
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Allow parent to re-open the modal (e.g. when a protected action is tried)
  useEffect(() => {
    if (forceOpen) setVisible(true);
  }, [forceOpen]);

  const handleClose = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, handleClose]);

  if (!visible) return null;

  return (
    /* Backdrop — clicking it closes the modal */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      {/* Card — stop propagation so clicks inside don't close the modal */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-prompt-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-400" />

        <div className="p-8">
          {/* Icon */}
          <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-950">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>

          {/* Heading */}
          <h2
            id="auth-prompt-title"
            className="text-xl font-bold tracking-tight text-zinc-950 mb-2"
          >
            Sign in to use your workspace
          </h2>

          <p className="text-sm text-zinc-500 leading-relaxed mb-8">
            Vertex Canvas requires an account to create projects, manage tasks,
            and collaborate with your team. It&apos;s free to get started.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/signIn"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in to your account
            </Link>

            <Link
              href="/signUp"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-semibold hover:bg-zinc-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create a free account
            </Link>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="mt-6 text-center text-xs text-zinc-400">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-zinc-600">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-zinc-600">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}