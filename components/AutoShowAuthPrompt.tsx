"use client";

import { useEffect } from "react";
import { useAuthPrompt } from "@/lib/contexts/AuthPromptContext";

export default function AutoShowAuthPrompt() {
  const { showAuthPrompt } = useAuthPrompt();

  useEffect(() => {
    // Delay slightly to prevent flashes and respect initial loading states
    const t = setTimeout(() => {
      showAuthPrompt();
    }, 100);
    return () => clearTimeout(t);
  }, [showAuthPrompt]);

  return null;
}
