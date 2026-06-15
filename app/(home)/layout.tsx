import Sidebar from "@/components/Sidebar";
import SidebarMain from "@/components/SidebarMain";
import type { ReactNode } from "react";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getProjects } from "@/app/actions/tasks";
import { getUserTeams } from "@/app/actions/chat";

interface HomeLayoutProps {
  children: ReactNode;
}

export default async function HomeLayout({ children }: HomeLayoutProps) {
  const userId = await getSessionUserId();
  let user = null;

  if (userId) {
    user = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
    });
  }

  const userTeams = userId ? await getUserTeams() : [];
  const teamIds = userTeams.map((t) => t.id);

  // Only show projects that belong to a workspace the current user is a member of.
  const initialProjects = await getProjects(teamIds);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Sidebar
        user={user}
        initialProjects={initialProjects}
        userTeams={userTeams.map((t) => ({ id: t.id, name: t.name }))}
      />
      <SidebarMain>{children}</SidebarMain>
    </div>
  );
}