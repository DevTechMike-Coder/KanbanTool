"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export type ActivityAction =
  | "task_created"
  | "task_moved"
  | "task_assigned"
  | "task_deleted"
  | "comment_added"
  | "project_created";

interface LogActivityInput {
  action: ActivityAction;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  /** JSON-serialisable bag of extra context, e.g. { from: "todo", to: "in-progress" } */
  meta?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity logger.
 * Never throws — callers must NOT await this if they don't want failures to
 * surface in the UI. The actor name is resolved from session inside.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return;

    const actor = await prisma.profile.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const actorName = actor?.name || actor?.email?.split("@")[0] || "Someone";

    await prisma.activityLog.create({
      data: {
        userId,
        actorName,
        action: input.action,
        projectId:   input.projectId   ?? null,
        projectName: input.projectName ?? null,
        taskId:      input.taskId      ?? null,
        taskTitle:   input.taskTitle   ?? null,
        meta: input.meta ? JSON.stringify(input.meta) : null,
      },
    });
  } catch {
    // Swallow — activity logging must never break a mutation
  }
}

// ─── Read side ────────────────────────────────────────────────────────────────

export type ActivityEntry = {
  id: string;
  userId: string;
  actorName: string | null;
  action: ActivityAction;
  projectId: string | null;
  projectName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
};

export async function getRecentActivity(
  limit = 30,
  projectId?: string,
): Promise<ActivityEntry[]> {
  const rows = await prisma.activityLog.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    ...row,
    action: row.action as ActivityAction,
    meta: row.meta ? (JSON.parse(row.meta) as Record<string, unknown>) : null,
  }));
}
