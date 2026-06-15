import StatsCard from "@/components/StatsCard";
import KanbanBoard from "@/components/KanbanBoard";
import NotificationBell from "@/components/NotificationBell";
import HelpPanel from "@/components/HelpPanel";
import AutoShowAuthPrompt from "@/components/AutoShowAuthPrompt";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getNotifications } from "@/app/actions/notifications";

const t = {
  workspaceTitle: "Overview",
  workspaceDescription: "Track projects, tasks, and team activity.",
  searchPlaceholder: "Search projects, tasks, or members...",
  searchLabel: "Search workspace",
  notificationsLabel: "Notifications",
  helpLabel: "Help",
  createButton: "New Project",
};

export default async function HomePage() {
  const userId = await getSessionUserId();

  let dbProjects: any[] = [];
  let currentUser = null;
  let teamMembersCount = 0;
  let userTeams: Array<{ id: string; name: string }> = [];

  if (userId) {
    currentUser = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    userTeams = await prisma.team.findMany({
      // ← assign (no const/let)
      where: { members: { some: { id: userId } } },
      select: { id: true, name: true },
    });
    const teamIds = userTeams.map((t) => t.id);

    teamMembersCount = await prisma.profile.count({
      where: {
        teams: { some: { id: { in: teamIds } } },
        NOT: { id: userId },
      },
    });

    dbProjects = await prisma.project.findMany({
      where: {
        teamId: { in: teamIds }, // only the user's workspace projects
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } else {
    dbProjects = [];
  }

  const projectIds = dbProjects.map((p) => p.id);

  const openTasksCount = await prisma.task.count({
    where: {
      NOT: { column: "completed" },
      projectId: { in: projectIds }, // scoped to user's actual projects
    },
  });

  const completedTasksCount = await prisma.task.count({
    where: {
      column: "completed",
      projectId: { in: projectIds },
    },
  });

  const activeProjectsCount = projectIds.length;

  const initialNotifications = userId ? await getNotifications() : [];

  // Convert DB projects to simple objects for serialized props
  const projects = dbProjects.map((p) => ({
    id: p.id,
    name: p.name,
    summary: p.summary,
    productGoal: p.productGoal,
  }));

  return (
    <section className="px-4 py-6 md:px-8">
      {/* Auth prompt for unauthenticated visitors */}
      {!userId && <AutoShowAuthPrompt />}

      <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.workspaceTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{t.workspaceDescription}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <NotificationBell initialNotifications={initialNotifications} />

            <HelpPanel />
          </div>
        </div>
      </header>

      <div className="mt-8">
        <StatsCard
          activeProjects={activeProjectsCount}
          openTasks={openTasksCount}
          completedTasks={completedTasksCount}
          teamMembers={teamMembersCount}
        />
      </div>

      <div className="mt-8">
        <KanbanBoard
          projects={projects}
          currentUser={currentUser}
          userTeams={userTeams}
        />
      </div>
    </section>
  );
}