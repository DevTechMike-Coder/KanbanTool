import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/session";
import { getTeamInviteInfo } from "@/app/actions/chat";
import { prisma } from "@/lib/prisma";
import AcceptInviteClient from "@/components/AcceptInviteClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { teamId } = await params;
  const userId = await getSessionUserId();

  if (!userId) {
    redirect(`/signIn?redirect=/invite/${teamId}`);
  }

  // Check if they are already a member of the team
  const teamDetails = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: { id: true },
      },
    },
  });

  if (teamDetails?.members.some((m) => m.id === userId)) {
    redirect(`/teams/${teamId}/collab`);
  }

  // Fetch the workspace info for this invite link
  const invite = await getTeamInviteInfo(teamId);

  if (!invite) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] md:min-h-screen items-center justify-center bg-zinc-50/50 px-4 py-12">
        <Card className="w-full max-w-md shadow-md border-zinc-200 bg-white">
          <CardHeader className="flex flex-col items-center pb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-100 text-red-600 mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold text-zinc-900 text-center">
              Invalid Invite Link
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-sm text-zinc-500">
              This invite link is invalid or the workspace no longer exists.
              Please ask the workspace owner for a new invite link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] md:min-h-screen items-center justify-center bg-zinc-50/50 px-4 py-12">
      <Card className="w-full max-w-md shadow-md border-zinc-200 bg-white">
        <CardContent className="pt-6">
          <AcceptInviteClient
            teamId={teamId}
            teamName={invite.name}
            creatorName={invite.creatorName}
          />
        </CardContent>
      </Card>
    </div>
  );
}