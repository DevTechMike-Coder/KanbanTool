"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Mail, 
  Briefcase, 
  Shield, 
  Copy, 
  Check, 
  LogOut, 
  UserMinus, 
  MessageSquare,
  ShieldCheck,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { removeTeamMember } from "@/app/actions/chat";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  taskCount?: number;
}

interface MembersViewProps {
  teamId: string;
  teamName: string;
  members: Profile[];
  currentUserId: string;
  creatorId?: string;
}

export default function MembersView({
  teamId,
  teamName,
  members,
  currentUserId,
  creatorId,
}: MembersViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState<string | null>(null);

  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/invite/${teamId}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Link Copied",
        message: "Invite link copied to clipboard.",
        type: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link", err);
      toast({
        title: "Error",
        message: "Failed to copy invite link to clipboard.",
        type: "error",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from this workspace? They will lose access to all projects and chats.`
      )
    ) {
      return;
    }

    setIsActionInProgress(memberId);
    try {
      await removeTeamMember(teamId, memberId);
      toast({
        title: "Member Removed",
        message: `${memberName} has been removed from the workspace.`,
        type: "success",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        message: err.message || "Failed to remove member. Please try again.",
        type: "error",
      });
    } finally {
      setIsActionInProgress(null);
    }
  };

  const handleLeaveTeam = async () => {
    if (
      !confirm(
        "Are you sure you want to leave this workspace? You will lose access to all chats and projects instantly."
      )
    ) {
      return;
    }

    setIsActionInProgress(currentUserId);
    try {
      await removeTeamMember(teamId, currentUserId);
      toast({
        title: "Left Workspace",
        message: `You have successfully left the workspace "${teamName}".`,
        type: "success",
      });
      router.push("/teams");
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        message: err.message || "Failed to leave workspace. Please try again.",
        type: "error",
      });
      setIsActionInProgress(null);
    }
  };

  // Filter members in real-time
  const filteredMembers = members.filter((member) => {
    const name = (member.name || "").toLowerCase();
    const email = member.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Calculate stats
  const totalTasks = members.reduce((sum, member) => sum + (member.taskCount || 0), 0);
  const ownerProfile = members.find((member) => member.id === creatorId);
  const ownerName = ownerProfile 
    ? (ownerProfile.name || ownerProfile.email.split("@")[0]) 
    : "Unknown Owner";

  return (
    <div className="flex-1 min-h-[calc(100vh-56px)] md:min-h-screen bg-zinc-50/40 pb-12">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => router.push(`/teams/${teamId}/collab`)}
              className="h-8 w-8 hover:bg-zinc-100 border-zinc-200"
              aria-label="Back to chat"
            >
              <ArrowLeft className="h-4 w-4 text-zinc-600" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                  Team Members
                </h1>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                  {members.length}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage participants and access for <span className="font-semibold text-zinc-700">{teamName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/teams/${teamId}/collab`)}
              className="text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            >
              <MessageSquare className="h-4 w-4 text-zinc-500 mr-1.5" />
              Open Chat
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopy}
              className="bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1.5" />
                  Invite Link
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-zinc-200/80 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Members</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{members.length}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Active in workspace</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Active Tasks</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-0.5">{totalTasks}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Assigned to team members</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Workspace Owner</p>
                <h3 className="text-lg font-bold text-zinc-900 truncate max-w-[200px] mt-0.5" title={ownerName}>
                  {ownerName}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Full administrative control</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members Roster List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-200/60 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 border-zinc-200 bg-white"
                />
              </div>
              <span className="text-xs text-zinc-500 shrink-0 select-none self-center">
                Showing {filteredMembers.length} of {members.length}
              </span>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-zinc-200 bg-white/40 shadow-inner">
                <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-zinc-400" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-800">No members found</h4>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Try adjusting your search query or invite new members to join this workspace.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembers.map((member) => {
                  const memberName = member.name || member.email.split("@")[0];
                  const isCurrent = member.id === currentUserId;
                  const isOwner = member.id === creatorId;
                  const currentUserIsOwner = currentUserId === creatorId;

                  // Initials
                  const memberInitials = memberName
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "UN";

                  // Gradient color generator
                  const gradients = [
                    "from-indigo-500 to-purple-600",
                    "from-emerald-500 to-teal-600",
                    "from-rose-500 to-pink-600",
                    "from-amber-500 to-orange-600",
                    "from-blue-500 to-cyan-600",
                  ];
                  const charCodeSum = memberName
                    .split("")
                    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
                  const gradientClass = gradients[charCodeSum % gradients.length];

                  return (
                    <Card
                      key={member.id}
                      className="border-zinc-200/80 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 bg-white/80"
                    >
                      <CardContent className="pt-5 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={memberName}
                                className="h-10 w-10 rounded-full border border-zinc-100 object-cover shadow-sm"
                              />
                            ) : (
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${gradientClass} text-xs font-bold text-white shadow-sm`}
                              >
                                {memberInitials}
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-800 text-sm truncate leading-tight block">
                                {memberName}
                              </span>
                              {isCurrent && (
                                <span className="shrink-0 rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 shrink-0" />
                              {member.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                          <div className="flex items-center gap-1 text-zinc-500">
                            <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{member.taskCount || 0} assigned tasks</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isOwner ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 border border-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-700">
                                <Shield className="h-2.5 w-2.5" />
                                Owner
                              </span>
                            ) : (
                              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500">
                                Member
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        {(!isOwner && (currentUserIsOwner || isCurrent)) && (
                          <div className="pt-2 border-t border-zinc-100">
                            {isCurrent ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isActionInProgress !== null}
                                onClick={handleLeaveTeam}
                                className="w-full text-xs font-semibold justify-center h-8"
                              >
                                <LogOut className="h-3 w-3 mr-1.5" />
                                {isActionInProgress === currentUserId ? "Leaving..." : "Leave Workspace"}
                              </Button>
                            ) : (
                              currentUserIsOwner && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isActionInProgress !== null}
                                  onClick={() => handleRemoveMember(member.id, memberName)}
                                  className="w-full text-xs font-semibold justify-center h-8"
                                >
                                  <UserMinus className="h-3 w-3 mr-1.5" />
                                  {isActionInProgress === member.id ? "Removing..." : "Remove Member"}
                                </Button>
                              )
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Panel */}
          <div className="space-y-6">
            <Card className="border-zinc-200/80 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-zinc-800 text-sm font-semibold flex items-center gap-1.5">
                  Invite Coworkers
                </CardTitle>
                <CardDescription className="text-zinc-500 text-xs">
                  Share this secret link with people you want to join this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="h-9 border-zinc-200 text-xs select-all bg-zinc-50/50 text-zinc-600 focus-visible:ring-0"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="h-9 w-9 shrink-0 border-zinc-200 hover:bg-zinc-50"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-500" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-500 text-xs leading-relaxed">
                  <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>
                    Invitees must register or sign in to accept the invitation and access the team chat and Kanban board.
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-zinc-800 text-sm font-semibold">Workspace Security</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-500 space-y-3">
                <p>
                  Only the workspace creator can rename or delete this workspace, and remove existing team members.
                </p>
                <p>
                  Members can choose to leave the workspace at any time, which clears their credentials and access logs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
