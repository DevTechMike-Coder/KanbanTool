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

  // getTeamDetails throws (via verifyTeamAccess) for an unauthenticated
  // session, a non-member, or a non-existent team alike. The prisma task
  // lookup below only needs teamId, not the result of getTeamDetails, so it
  // runs concurrently rather than waiting on it.
  let team!: Awaited<ReturnType<typeof getTeamDetails>>;
  let userId!: Awaited<ReturnType<typeof getSessionUserId>>;
  let teamTasks!: Array<{ assigneeId: string | null }>;
  try {
    [team, userId, teamTasks] = await Promise.all([
      getTeamDetails(teamId),
      getSessionUserId(),
      prisma.task.findMany({
        where: { project: { teamId } },
        select: { assigneeId: true },
      }),
    ]);
  } catch {
    const sessionUserId = await getSessionUserId();
    redirect(sessionUserId ? `/invite/${teamId}` : "/signIn");
  }

  if (!team) {
    notFound();
  }

  if (!userId) {
    redirect("/signIn");
  }

  const currentUser = team.members.find((member) => member.id === userId) || null;
  if (!currentUser) {
    redirect(`/invite/${teamId}`);
  }

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
