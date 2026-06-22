"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface MembersViewProps {
  teamId: string;
  teamName: string;
  members: Profile[];
  currentUserId: string;
}

export default function MembersView({
  teamId,
  teamName,
  members,
  currentUserId,
}: MembersViewProps) {
  const router = useRouter();

  return (
    <section className="flex h-[calc(100vh-56px)] md:hidden flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <button
          type="button"
          onClick={() => router.push(`/teams/${teamId}/collab`)}
          aria-label="Back to chat"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="flex items-center gap-1.5 text-sm font-bold text-zinc-950">
            <Users className="h-3.5 w-3.5" />
            Members ({members.length})
          </h1>
          <p className="truncate text-[11px] text-zinc-400">{teamName}</p>
        </div>
      </header>

      {/* Roster */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-2">
          {members.map((member) => {
            const memberName = member.name || member.email.split("@")[0];
            const memberInitials =
              memberName
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "UN";

            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={memberName}
                        className="h-9 w-9 rounded-full border border-zinc-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                        {memberInitials}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-emerald-500" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-zinc-800">
                      {memberName}
                    </span>
                    <span className="truncate text-xs text-zinc-400">
                      {member.email}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500">
                  {member.id === currentUserId ? "You" : "Member"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
