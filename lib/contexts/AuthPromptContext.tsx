"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import AuthPromptModal from "@/components/AuthPromptModal";

interface AuthPromptContextType {
  showAuthPrompt: () => void;
  hideAuthPrompt: () => void;
  isOpen: boolean;
}

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined);

export function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const showAuthPrompt = useCallback(() => {
    setIsOpen(true);
  }, []);

  const hideAuthPrompt = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthPromptContext.Provider value={{ showAuthPrompt, hideAuthPrompt, isOpen }}>
      {children}
      {isOpen && (
        <AuthPromptModal
          forceOpen={isOpen}
          onClose={hideAuthPrompt}
        />
      )}
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext);
  if (!context) {
    throw new Error("useAuthPrompt must be used within an AuthPromptProvider");
  }
  return context;
}
