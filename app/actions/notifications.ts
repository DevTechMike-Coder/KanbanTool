"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

// Called internally by other server actions — not directly by the client
export async function createNotification(
  userId: string,
  type: "task_assigned" | "task_comment" | "team_invite",
  message: string,
  link?: string,
) {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: { userId, type, message, link: link ?? null },
    });
  } catch {
    // Non-critical — never let notification failure break the main action
  }
}

export async function getNotifications() {
  const userId = await getSessionUserId();
  if (!userId) return [];

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function markNotificationRead(notificationId: string) {
  const userId = await getSessionUserId();
  if (!userId) return;

  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead() {
  const userId = await getSessionUserId();
  if (!userId) return;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  revalidatePath("/home", "layout");
}