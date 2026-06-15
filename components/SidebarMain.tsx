"use client";

import { useSidebar } from "@/lib/contexts/SidebarContext";

interface SidebarMainProps {
  children: React.ReactNode;
}

export default function SidebarMain({ children }: SidebarMainProps) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={`min-h-screen pt-14 md:pt-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "md:ml-16" : "md:ml-64"
      }`}
    >
      {children}
    </main>
  );
}
