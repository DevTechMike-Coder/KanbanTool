"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeam } from "@/app/actions/chat";
import { ShieldCheck, Zap, Check, Copy, ArrowRight } from "lucide-react";
import VertexIcon from "./iconComp/Vertex";

export default function CreateWorkspace() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdTeam, setCreatedTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteLink = createdTeam
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${createdTeam.id}`
    : "";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setErrorMsg("Workspace name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const team = await createTeam(workspaceName.trim());
      setCreatedTeam({ id: team.id, name: team.name });
      router.refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to create workspace. Please try again.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link", err);
    }
  };

  const handleContinue = () => {
    if (createdTeam) {
      router.push(`/teams/${createdTeam.id}/collab`);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="mb-4 p-3 rounded-2xl bg-zinc-950 text-white shadow-lg flex items-center justify-center shrink-0">
          <VertexIcon />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 font-sans">
          {createdTeam ? "Workspace Created" : "Establish Your Workspace"}
        </h2>
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-sans max-w-sm">
          {createdTeam
            ? "Share this invite link with anyone you want to collaborate with. They'll join as soon as they open it and sign in."
            : "Set up your collaborative canvas. Once it's ready, you'll get a shareable invite link for your teammates."}
        </p>
      </div>

      {createdTeam ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">
              Invite Link
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteLink}
                onFocus={(e) => e.target.select()}
                className="h-10 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="h-10 shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-450 font-sans mt-1">
              Anyone with this link can join &quot;{createdTeam.name}&quot;
              after signing in to Vertex Canvas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full mt-4 flex items-center justify-center gap-2 h-10 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 font-semibold text-sm transition-all shadow-md cursor-pointer"
          >
            Go to Workspace
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="space-y-5">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="ws-name"
              className="text-xs font-semibold text-zinc-700"
            >
              Workspace / Team Name
            </label>
            <input
              id="ws-name"
              type="text"
              required
              placeholder="e.g. Vertex Engineering Core"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden transition-all shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !workspaceName.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 h-10 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all shadow-md cursor-pointer"
          >
            {isSubmitting
              ? "Creating Workspace..."
              : "Create & Initialize Workspace"}
          </button>
        </form>
      )}

      {/* Feature Intersection Footer */}
      <div className="mt-8 pt-6 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        <div className="flex gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-[11px] font-bold text-zinc-800">Secure Sync</h5>
            <p className="text-[9px] text-zinc-450 mt-0.5 font-sans leading-normal">
              Encrypted messaging lines for workspace developers.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-[11px] font-bold text-zinc-800">
              Real-Time Hub
            </h5>
            <p className="text-[9px] text-zinc-450 mt-0.5 font-sans leading-normal">
              Concurrent chat stream integrated with database pipelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}