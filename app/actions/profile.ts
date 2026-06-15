"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name?: string; bio?: string | null; avatarUrl?: string | null }) {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error("You must be logged in to update your profile.");
  }

  const updated = await prisma.profile.update({
    where: { id: userId },
    data,
  });

  revalidatePath("/home");
  revalidatePath("/settings");
  return updated;
}
