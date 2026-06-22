import { getTeamDetails } from "@/app/actions/chat";
import { getSessionUserId } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import MembersView from "@/components/MembersView";

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

  return (
    <MembersView
      teamId={teamId}
      teamName={team.name}
      members={team.members}
      currentUserId={userId}
    />
  );
}
