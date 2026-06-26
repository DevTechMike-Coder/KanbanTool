"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Users, Link2, Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

interface TeamSwitcherProps {
  currentTeamId: string;
  teams: Array<{ id: string; name: string }>;
}

export default function TeamSwitcher({ currentTeamId, teams }: TeamSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const handleTeamSwitch = (teamId: string) => {
    if (teamId === currentTeamId) {
      setIsOpen(false);
      return;
    }
    setSwitchingTo(teamId);
    setIsOpen(false);
    startTransition(() => {
      router.push(`/teams/${teamId}/collab`);
    });
  };

  const handleCopyInviteLink = async () => {
    const link = `${window.location.origin}/invite/${currentTeamId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link", err);
    }
  };

  const activeTeamName = teams.find((t) => t.id === currentTeamId)?.name || "Select Team";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white hover:bg-zinc-55 text-zinc-800 transition-colors shadow-xs cursor-pointer focus:outline-hidden disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
        ) : (
          <Users className="w-3.5 h-3.5 text-zinc-500" />
        )}
        <span>{isPending ? "Switching…" : activeTeamName}</span>
        {!isPending && <ChevronDown className="w-3 h-3 text-zinc-400" />}
      </button>

      {isOpen && (
        <>
          {/* Overlay to detect click outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1.5 w-56 rounded-lg border border-zinc-100 bg-white shadow-lg z-50 py-1 focus:outline-hidden animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Switch Team Workspace
            </div>
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => handleTeamSwitch(team.id)}
                disabled={isPending}
                className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer hover:bg-zinc-50 flex items-center gap-2 disabled:cursor-wait ${
                  currentTeamId === team.id ? "font-semibold text-zinc-950 bg-zinc-50" : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                {isPending && switchingTo === team.id ? (
                  <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full ${currentTeamId === team.id ? "bg-zinc-950" : "bg-transparent"}`} />
                )}
                {team.name}
              </button>
            ))}
            <div className="my-1 border-t border-zinc-100" />
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer hover:bg-zinc-50 flex items-center gap-2 text-zinc-600 hover:text-zinc-950"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Invite link copied!
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                  Copy invite link
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}