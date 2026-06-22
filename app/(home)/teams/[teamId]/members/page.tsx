import { getTeamDetails } from "@/app/actions/chat";
import { getSessionUserId } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import MembersView from "@/components/MembersView";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamMembersPage({ params }: PageProps) {
  const { teamId } = await params;

  const team = await getTeamDetails(teamId);
  if (!team) {
    notFound();
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/signIn");
  }

  const currentUser = team.members.find((member) => member.id === userId) || null;
  if (!currentUser) {
    redirect(`/invite/${teamId}`);
  }

  // Fetch tasks belonging to projects in this team/workspace to calculate task counts
  const teamTasks = await prisma.task.findMany({
    where: {
      project: { teamId },
    },
    select: {
      assigneeId: true,
    },
  });

  const taskCounts: Record<string, number> = {};
  for (const t of teamTasks) {
    if (t.assigneeId) {
      taskCounts[t.assigneeId] = (taskCounts[t.assigneeId] || 0) + 1;
    }
  }

  const membersWithTaskCount = team.members.map((member) => ({
    ...member,
    taskCount: taskCounts[member.id] || 0,
  }));

  return (
    <MembersView
      teamId={teamId}
      teamName={team.name}
      members={membersWithTaskCount}
      currentUserId={userId}
      creatorId={team.creatorId || undefined}
    />
  );
}
