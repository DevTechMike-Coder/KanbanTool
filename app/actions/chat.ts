"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

async function verifyTeamAccess(teamId: string): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error("You must be logged in to perform this action.");
  }

  const isMember = await prisma.team.findFirst({
    where: { id: teamId, members: { some: { id: userId } } },
    select: { id: true },
  });
  if (!isMember) {
    throw new Error("You do not have access to this workspace.");
  }
  return userId;
}

export async function getMessages(teamId: string) {
  await verifyTeamAccess(teamId);
  return prisma.message.findMany({
    where: {
      teamId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function sendMessage(teamId: string, text: string) {
  const userId = await verifyTeamAccess(teamId);

  const message = await prisma.message.create({
    data: {
      text,
      teamId,
      senderId: userId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  revalidatePath(`/teams/${teamId}/collab`);
  return message;
}

export async function getUserTeams() {
  const userId = await getSessionUserId();
  if (!userId) return [];

  return prisma.team.findMany({
    where: {
      members: {
        some: { id: userId },
      },
    },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getTeamDetails(teamId: string) {
  await verifyTeamAccess(teamId);
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function createTeam(name: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error("You must be logged in to create a workspace.");
  }

  // Guard: ensure a Profile row exists for this session user.
  // Missing profiles happen when test scripts create Supabase auth users
  // directly, bypassing the sign-up flow that writes the Profile row.
  const existing = await prisma.profile.findUnique({ where: { id: userId } });
  if (!existing) {
    const supabaseUrl =
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

    if (!supabaseUrl || !serviceKey) {
      throw new Error(
        "Your account profile is missing. Please sign out and sign back in to fix this.",
      );
    }

    // Fetch the auth user record from Supabase using the service key
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!res.ok) {
      // Log the actual Supabase error for debugging
      const errBody = await res.json().catch(() => null);
      console.error("[createTeam] Supabase admin user lookup failed:", {
        status: res.status,
        userId,
        body: errBody,
      });

      // 404 means the auth user was deleted (e.g. leftover test accounts).
      // Clear the stale session so the user is prompted to sign in fresh.
      const { clearSessionCookie } = await import("@/lib/auth/session");
      await clearSessionCookie();

      throw new Error(
        res.status === 404
          ? "This account no longer exists. Please sign up or sign in with a different account."
          : "Your account profile could not be recovered. Please sign out and sign back in.",
      );
    }

    const authUser = (await res.json()) as {
      id: string;
      email: string;
      user_metadata?: { name?: string };
    };

    await prisma.profile.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name ?? authUser.email.split("@")[0],
      },
    });
  }

  // Create the team and connect ONLY the creator. Additional members join
  // later via the shareable invite link generated for this workspace.
  const team = await prisma.team.create({
    data: {
      name,
      creatorId: userId,
      members: {
        connect: [{ id: userId }],
      },
    },
  });

  // Create initial system welcome message
  await prisma.message.create({
    data: {
      text: `Workspace "${name}" has been created! Real-time sync channel is now online.`,
      teamId: team.id,
      senderId: userId,
    },
  });

  revalidatePath("/teams");
  return team;
}

export async function getTeamInviteInfo(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    creatorName: team.creator?.name || team.creator?.email || "A developer",
  };
}

export async function joinTeamViaInvite(teamId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error("You must be logged in to join a workspace.");
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: { id: true },
      },
    },
  });

  if (!team) {
    throw new Error(
      "This invite link is invalid or the workspace no longer exists.",
    );
  }

  if (team.members.some((m) => m.id === userId)) {
    return { success: true };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  await prisma.$transaction([
    prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
    }),
    prisma.message.create({
      data: {
        text: `${profile?.name || profile?.email || "A new member"} joined the workspace via invite link.`,
        teamId,
        senderId: userId,
      },
    }),
  ]);

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}/collab`);
  revalidatePath("/home");

  return { success: true };
}