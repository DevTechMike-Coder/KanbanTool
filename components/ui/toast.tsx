"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id">) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, message, type = "info", duration = 4000 }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function Toaster() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, dismiss } = context;

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-55 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const typeStyles = {
          success: {
            bg: "bg-emerald-50/90 border-emerald-200 text-emerald-800 shadow-emerald-50/20",
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
          },
          error: {
            bg: "bg-rose-50/90 border-rose-200 text-rose-800 shadow-rose-50/20",
            icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
          },
          warning: {
            bg: "bg-amber-50/90 border-amber-200 text-amber-800 shadow-amber-50/20",
            icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
          },
          info: {
            bg: "bg-zinc-50/90 border-zinc-200 text-zinc-800 shadow-zinc-50/20",
            icon: <Info className="h-5 w-5 text-indigo-600 shrink-0" />,
          },
        }[t.type || "info"];

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${typeStyles.bg}`}
            role="alert"
          >
            {typeStyles.icon}
            <div className="flex-1 min-w-0">
              {t.title && <h5 className="text-sm font-semibold tracking-tight leading-tight">{t.title}</h5>}
              <p className={`text-xs mt-0.5 leading-relaxed font-sans ${t.title ? "opacity-90" : ""}`}>
                {t.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors rounded-lg p-0.5 shrink-0 h-fit"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
