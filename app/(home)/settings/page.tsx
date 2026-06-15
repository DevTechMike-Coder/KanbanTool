import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/signIn");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  if (!profile) {
    redirect("/signIn");
  }

  // Map database fields to settings form profile fields
  const formattedProfile = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    bio: profile.bio || null,
    avatarUrl: profile.avatarUrl || null,
  };

  return <SettingsForm profile={formattedProfile} />;
}
