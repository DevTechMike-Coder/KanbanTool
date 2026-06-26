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

  // 1-4. None of these four reads depend on each other's *results* — only on
  // teamId / the session cookie — so run them concurrently instead of as a
  // 4-step waterfall. This meaningfully cuts time-to-content on every visit.
  //
  // getTeamDetails/getMessages internally call verifyTeamAccess(teamId), which
  // throws for an unauthenticated session, a non-member, AND a non-existent
  // team alike (it can't distinguish "no access" from "doesn't exist"). Catch
  // that here and turn it into a clean redirect instead of an unhandled error.
  let team!: Awaited<ReturnType<typeof getTeamDetails>>;
  let userId!: Awaited<ReturnType<typeof getSessionUserId>>;
  let dbUserTeams!: Awaited<ReturnType<typeof getUserTeams>>;
  let initialMessages!: Awaited<ReturnType<typeof getMessages>>;
  try {
    [team, userId, dbUserTeams, initialMessages] = await Promise.all([
      getTeamDetails(teamId),
      getSessionUserId(),
      getUserTeams(),
      getMessages(teamId),
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

  const userTeams = dbUserTeams.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  // 5. Depends on team.members resolved above, so this one stays sequential.
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