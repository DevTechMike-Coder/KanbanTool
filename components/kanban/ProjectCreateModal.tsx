"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectCreateModalProps {
  userTeams: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    summary: string;
    goal: string;
    teamId: string;
  }) => Promise<void>;
}

export default function ProjectCreateModal({
  userTeams,
  onClose,
  onSubmit,
}: ProjectCreateModalProps) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [goal, setGoal] = useState("");
  const [teamId, setTeamId] = useState(userTeams[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teamId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), summary, goal, teamId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl transition-all duration-300 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-bold tracking-tight text-zinc-950">
            Create New Project
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Start a new canvas and workflow for your team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="modal-project-name"
              className="text-xs font-semibold text-zinc-700"
            >
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="modal-project-name"
              type="text"
              required
              placeholder="e.g. Mobile Application"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="modal-project-summary"
              className="text-xs font-semibold text-zinc-700"
            >
              Description / Summary
            </label>
            <textarea
              id="modal-project-summary"
              rows={2}
              placeholder="What is this project about?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="modal-project-goal"
              className="text-xs font-semibold text-zinc-700"
            >
              End Product / Goal
            </label>
            <textarea
              id="modal-project-goal"
              rows={2}
              placeholder="What is the ultimate delivery or target?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-hidden resize-none"
            />
          </div>

          {userTeams.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="modal-project-team"
                className="text-xs font-semibold text-zinc-700"
              >
                Workspace <span className="text-red-500">*</span>
              </label>
              <Select
                value={teamId}
                onValueChange={(value) => setTeamId(value)}
                aria-label="Workspace"
              >
                <SelectTrigger className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer text-left">
                  <SelectValue placeholder="Select a workspace..." />
                </SelectTrigger>
                <SelectContent>
                  {userTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-zinc-400">
                Projects belong to a workspace — only members of that
                workspace can see it and its tasks.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p>
                You need to create or join a workspace before you can create a project.{" "}
                <a
                  href="/teams"
                  onClick={onClose}
                  className="font-semibold underline hover:text-amber-900"
                >
                  Set up a workspace
                </a>
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !teamId}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
