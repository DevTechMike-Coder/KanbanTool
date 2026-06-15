"use client";

import { useEffect, useRef, useState } from "react";
import { Send, UserPlus, Users, Plus } from "lucide-react";
import { sendMessage } from "@/app/actions/chat";
import TeamSwitcher from "./TeamSwitcher";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface Sender {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface Message {
  id: string;
  text: string;
  teamId: string;
  createdAt: Date;
  sender: Sender;
}

interface Profile {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface TeamTask {
  id: string;
  title: string;
  column: string;
  priority: string;
  dueDate: string | Date | null;
  assignee?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
}

interface TeamChatProps {
  teamId: string;
  teamName: string;
  initialMessages: any[];
  currentUser: Profile | null;
  allProfiles: Profile[];
  userTeams: Array<{ id: string; name: string }>;
  teamTasks?: TeamTask[];
}

export default function TeamChat({
  teamId,
  teamName,
  initialMessages,
  currentUser,
  allProfiles,
  userTeams,
  teamTasks = [],
}: TeamChatProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }))
  );
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Partition tasks
  const activeTasks = teamTasks.filter((t) => ["in-progress", "review"].includes(t.column?.toLowerCase()));
  const stuckTasks = teamTasks.filter(
    (t) =>
      ["critical", "high"].includes(t.priority?.toLowerCase()) &&
      t.column?.toLowerCase() !== "completed"
  );
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate live peer activity (incoming messages)
  useEffect(() => {
    if (!currentUser || allProfiles.length <= 1) return;

    const peerProfiles = allProfiles.filter((p) => p.id !== currentUser.id);
    if (peerProfiles.length === 0) return;

    const messagesPool = [
      "Just pushed the latest styling updates to main.",
      "Are we ready for the sprint review tomorrow?",
      "I flagged a potential blocker on the review column task.",
      "Just finished reviewing the backend PR. Looks clean!",
      "I'm working on the auth workflow updates now.",
      "Let's sync up on the database schema adjustments in 10 mins.",
    ];

    const timer = setInterval(() => {
      // 25% chance of a simulated incoming message every 15 seconds
      if (Math.random() > 0.25) return;

      const randomPeer = peerProfiles[Math.floor(Math.random() * peerProfiles.length)];
      const randomText = messagesPool[Math.floor(Math.random() * messagesPool.length)];
      const peerName = randomPeer.name || randomPeer.email.split("@")[0];

      const simulatedMsg: Message = {
        id: `simulated-${Date.now()}`,
        text: randomText,
        teamId,
        createdAt: new Date(),
        sender: {
          id: randomPeer.id,
          name: randomPeer.name,
          email: randomPeer.email,
          avatarUrl: randomPeer.avatarUrl,
        },
      };

      setMessages((prev) => [...prev, simulatedMsg]);
      toast({
        title: `Message from ${peerName}`,
        message: randomText,
        type: "info",
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [currentUser, allProfiles, teamId, toast]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || isSending) return;

    const currentText = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic message update
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      text: currentText,
      teamId,
      createdAt: new Date(),
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatarUrl: currentUser.avatarUrl,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const realMessage = await sendMessage(teamId, currentText);
      // Replace optimistic message with server-persisted message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? {
                ...realMessage,
                createdAt: new Date(realMessage.createdAt),
              }
            : msg
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      toast({
        title: "Failed to Send Message",
        message: "Your message could not be delivered.",
        type: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-2px)] w-full font-sans bg-white">
      {/* 1. Header Section */}
      <header className="flex flex-col gap-3 px-4 py-4 border-b border-zinc-100 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2 sm:text-xl">
              <Users className="w-5 h-5 text-zinc-500 shrink-0" />
              <span>Team Collaboration</span>
            </h1>
            <TeamSwitcher
              currentTeamId={teamId}
              teams={userTeams}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Real-time chat and roster directory for workspace developers in {teamName}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/teams?new=true")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const inviteUrl = `${window.location.origin}/invite/${teamId}`;
              navigator.clipboard.writeText(inviteUrl);
              toast({
                title: "Invite Link Copied",
                message: "The team invite link has been copied to your clipboard.",
                type: "success",
              });
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>
      </header>

      {/* 2. Main Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Directory Roster */}
        <aside className="w-80 border-r border-zinc-100 bg-zinc-50/30 flex flex-col p-4 overflow-y-auto hidden md:flex">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
            Workspace Directory ({allProfiles.length})
          </h2>
          <div className="flex flex-col gap-1.5">
            {allProfiles.map((member) => {
              const memberName = member.name || member.email.split("@")[0];
              const memberInitials = memberName
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "UN";

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-transparent bg-white hover:border-zinc-200 shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={memberName}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-semibold">
                          {memberInitials}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white bg-emerald-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-zinc-800 truncate">
                        {memberName}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {member.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                    {member.id === currentUser?.id ? "You" : "Member"}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Side: Chat Streams */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {messages.map((msg) => {
              const senderName = msg.sender.name || msg.sender.email.split("@")[0];
              const senderInitials = senderName
                .split(/\s+/)
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "US";

              const timeString = msg.createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={msg.id} className="flex gap-4 items-start max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {msg.sender.avatarUrl ? (
                    <img
                      src={msg.sender.avatarUrl}
                      alt={senderName}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold shrink-0 border border-zinc-200">
                      {senderInitials}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-zinc-900">
                        {senderName}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {timeString}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-650 mt-1 leading-relaxed bg-zinc-55/80 rounded-r-xl rounded-bl-xl p-3 border border-zinc-100/80 bg-zinc-50 shadow-xs">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <div className="p-4 border-t border-zinc-100 bg-white">
            {currentUser ? (
              <form onSubmit={handleSend} className="relative flex items-center w-full max-w-4xl mx-auto">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${teamName} sync channel...`}
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-450 focus:outline-hidden focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="absolute right-2 p-1.5 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="text-center py-2 text-sm text-zinc-500">
                You must be signed in to contribute to this chat channel.
              </div>
            )}
          </div>
        </main>

        {/* Right Side: Active & Blocked Task Summary Pane */}
        <aside className="w-80 border-l border-zinc-100 bg-zinc-50/30 flex flex-col p-4 overflow-y-auto hidden lg:flex">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 px-1">
            Workspace Task Activity
          </h2>

          <div className="space-y-6">
            {/* Active Tasks Group */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2 px-1 flex items-center justify-between">
                <span>Active Work ({activeTasks.length})</span>
              </h3>
              {activeTasks.length === 0 ? (
                <p className="text-[11px] text-zinc-400 px-1 py-2 italic font-sans">
                  No tasks currently in progress.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-white border border-zinc-150 rounded-lg shadow-2xs hover:border-zinc-350 transition-all">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="font-mono text-[9px] font-bold text-zinc-400">{task.id}</span>
                        <span className="rounded bg-blue-50 text-blue-700 px-1 py-0.5 text-[8px] font-bold uppercase font-mono">{task.column}</span>
                      </div>
                      <h4 className="text-xs font-medium text-zinc-800 leading-snug line-clamp-2">{task.title}</h4>
                      <div className="mt-2 flex justify-between items-center text-[10px] text-zinc-450 font-sans">
                        <span>Owner: {task.assignee?.name || "Unassigned"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blocked / High Priority Group */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2 px-1 flex items-center justify-between">
                <span>Blocked / High Priority ({stuckTasks.length})</span>
              </h3>
              {stuckTasks.length === 0 ? (
                <p className="text-[11px] text-zinc-400 px-1 py-2 italic font-sans">
                  No blocked or high priority work.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {stuckTasks.map((task) => {
                    const isCritical = task.priority?.toLowerCase() === "critical";
                    return (
                      <div key={task.id} className="p-3 bg-white border border-zinc-150 rounded-lg shadow-2xs hover:border-zinc-350 transition-all">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className="font-mono text-[9px] font-bold text-zinc-400">{task.id}</span>
                          <span className={`rounded px-1 py-0.5 text-[8px] font-bold uppercase font-mono ${isCritical ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                            {task.priority}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-zinc-800 leading-snug line-clamp-2">{task.title}</h4>
                        <div className="mt-2 flex justify-between items-center text-[10px] text-zinc-455 font-sans">
                          <span>Owner: {task.assignee?.name || "Unassigned"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
