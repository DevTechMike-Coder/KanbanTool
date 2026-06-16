"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export async function getStats() {
  const userId = await getSessionUserId();
  if (!userId) {
    return { projects: 0, openTasks: 0, completedTasks: 0, teamMembers: 0 };
  }

  const [projects, openTasks, completedTasks, teams] = await Promise.all([
    prisma.project.count({
      where: { team: { members: { some: { id: userId } } } },
    }),
    prisma.task.count({
      where: {
        project: { team: { members: { some: { id: userId } } } },
        column: { not: "completed" },
      },
    }),
    prisma.task.count({
      where: {
        project: { team: { members: { some: { id: userId } } } },
        column: "completed",
      },
    }),
    prisma.team.findMany({
      where: { members: { some: { id: userId } } },
      include: { members: { select: { id: true } } },
    }),
  ]);

  const uniqueMembers = new Set(
    teams.flatMap((t) => t.members.map((m) => m.id))
  );

  return {
    projects,
    openTasks,
    completedTasks,
    teamMembers: uniqueMembers.size,
  };
}
