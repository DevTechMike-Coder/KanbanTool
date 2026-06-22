"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

// Called by the client on user activity to mark the user as online
export async function pingPresence() {
  const userId = await getSessionUserId();
  if (!userId) return;

  await prisma.profile.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
}

// Returns a map of userId -> isOnline for all members of the given team.
// A user is online if their lastActiveAt is within the last 10 seconds.
export async function getTeamPresence(
  teamId: string
): Promise<Record<string, boolean>> {
  const userId = await getSessionUserId();
  if (!userId) return {};

  const threshold = new Date(Date.now() - 10_000); // 10 seconds ago

  const team = await prisma.team.findFirst({
    where: { id: teamId, members: { some: { id: userId } } },
    include: {
      members: {
        select: { id: true, lastActiveAt: true },
      },
    },
  });

  if (!team) return {};

  return Object.fromEntries(
    team.members.map((m) => [
      m.id,
      m.lastActiveAt !== null && m.lastActiveAt > threshold,
    ])
  );
}
