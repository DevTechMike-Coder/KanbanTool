import Sidebar from "@/components/Sidebar";
import type { ReactNode } from "react";

export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Sidebar />
      <main className="min-h-screen md:pl-64">{children}</main>
    </div>
  );
}
