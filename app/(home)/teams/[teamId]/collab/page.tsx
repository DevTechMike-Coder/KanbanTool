import TeamChat from "@/components/TeamChat";
import { getMessages, getTeamDetails, getUserTeams } from "@/app/actions/chat";
import { getSessionUserId } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamCollabPage({ params }: PageProps) {
  const { teamId } = await params;

  // 1. Fetch team details dynamically from PostgreSQL
  const team = await getTeamDetails(teamId);
  if (!team) {
    notFound();
  }

  // 2. Fetch current logged-in user profile
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/signIn");
  }

  const currentUser = team.members.find((member) => member.id === userId) || null;

  if (!currentUser) {
    redirect(`/invite/${teamId}`);
  }

  // 3. Fetch all workspaces the user is a member of (to populate the TeamSwitcher dropdown)
  const dbUserTeams = await getUserTeams();
  const userTeams = dbUserTeams.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  // 4. Fetch live chat history for this workspace
  const initialMessages = await getMessages(teamId);

  // 5. Fetch tasks related to this team's projects or assigned to team members
  const dbTeamTasks = await prisma.task.findMany({
    where: {
      OR: [
        {
          project: { teamId },
        },
        {
          assigneeId: { in: team.members.map((m) => m.id) },
        },
      ],
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const teamTasks = dbTeamTasks.map((t) => ({
    id: t.id,
    title: t.title,
    column: t.column,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assignee: t.assignee,
  }));

  return (
    <TeamChat
      teamId={teamId}
      teamName={team.name}
      initialMessages={initialMessages}
      currentUser={currentUser}
      allProfiles={team.members}
      userTeams={userTeams}
      teamTasks={teamTasks}
    />
  );
}