"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { joinTeamViaInvite } from "@/app/actions/chat";
import { Users2, Check } from "lucide-react";

interface AcceptInviteClientProps {
  teamId: string;
  teamName: string;
  creatorName: string;
}

export default function AcceptInviteClient({
  teamId,
  teamName,
  creatorName,
}: AcceptInviteClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await joinTeamViaInvite(teamId);
      if (res.success) {
        toast({
          title: "Invitation Accepted",
          message: `You are now a member of ${teamName}!`,
          type: "success",
        });
        router.push(`/teams/${teamId}/collab`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An error occurred while accepting the invitation.";
      toast({
        title: "Failed to Accept Invitation",
        message,
        type: "error",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4 animate-bounce">
        <Users2 className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
        Join Workspace
      </h2>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">
        <span className="font-semibold text-zinc-850">{creatorName}</span> has invited you to collaborate in the workspace <span className="font-semibold text-zinc-850">&quot;{teamName}&quot;</span>.
      </p>
      <Button
        onClick={handleAccept}
        disabled={isAccepting}
        className="mt-6 w-full max-w-xs bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg py-2.5 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer font-semibold"
      >
        {isAccepting ? (
          "Accepting..."
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>Accept & Join Team</span>
          </>
        )}
      </Button>
    </div>
  );
}