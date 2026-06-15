import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";
import { AuthPromptProvider } from "@/lib/contexts/AuthPromptContext";

export const metadata: Metadata = {
  title: "Vertex Canvas",
  description: "Vertex Canvas is a high-performance...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900">
        <ToastProvider>
          <TooltipProvider>
            <AuthPromptProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </AuthPromptProvider>
          </TooltipProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

