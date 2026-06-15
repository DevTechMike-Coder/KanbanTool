import { getRecentActivity, type ActivityAction } from "@/app/actions/activity";
import { Activity, GitCommitHorizontal } from "lucide-react";

// ─── Action display config ─────────────────────────────────────────────────────

const ACTION_META: Record<
  ActivityAction,
  { verb: (entry: Awaited<ReturnType<typeof getRecentActivity>>[number]) => string; color: string }
> = {
  task_created:    { verb: (e) => `created "${e.taskTitle}"`,                            color: "bg-blue-500"    },
  task_moved:      { verb: (e) => `moved "${e.taskTitle}" → ${e.meta?.to ?? ""}`,        color: "bg-amber-500"   },
  task_assigned:   { verb: (e) => `assigned "${e.taskTitle}"`,                           color: "bg-purple-500"  },
  task_deleted:    { verb: (e) => `deleted "${e.taskTitle}"`,                            color: "bg-red-500"     },
  comment_added:   { verb: (e) => `commented on "${e.taskTitle}"`,                       color: "bg-teal-500"    },
  project_created: { verb: (e) => `created project "${e.projectName}"`,                  color: "bg-emerald-500" },
};

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

function ActorAvatar({ name }: { name: string | null }) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-[9px] font-bold text-white">
      {initials}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  projectId?: string;
  limit?: number;
  className?: string;
}

export default async function ActivityFeed({
  projectId,
  limit = 25,
  className = "",
}: ActivityFeedProps) {
  const entries = await getRecentActivity(limit, projectId);

  return (
    <aside className={`flex flex-col rounded-xl border border-zinc-200/80 bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <Activity className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-900">Activity</h2>
        {entries.length > 0 && (
          <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-500">
            {entries.length}
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="flex flex-col overflow-y-auto max-h-[520px] scrollbar-thin">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <GitCommitHorizontal className="h-7 w-7 text-zinc-200" />
            <p className="text-xs text-zinc-400">No activity yet.</p>
            <p className="text-[11px] text-zinc-350">
              Actions like creating tasks and moving cards will appear here.
            </p>
          </div>
        ) : (
          <ol className="relative py-3">
            {/* vertical line */}
            <div className="absolute left-[20px] top-0 bottom-0 w-px bg-zinc-100" aria-hidden />

            {entries.map((entry) => {
              const cfg = ACTION_META[entry.action];
              const verb = cfg?.verb(entry) ?? entry.action;

              return (
                <li key={entry.id} className="relative flex items-start gap-3 px-4 py-2.5 hover:bg-zinc-50/60 transition-colors">
                  {/* Timeline dot */}
                  <div className={`relative z-10 mt-0.5 h-2 w-2 shrink-0 rounded-full ring-2 ring-white ${cfg?.color ?? "bg-zinc-400"}`} />

                  {/* Avatar */}
                  <ActorAvatar name={entry.actorName} />

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug text-zinc-700">
                      <span className="font-semibold text-zinc-900">{entry.actorName ?? "Someone"}</span>{" "}
                      {verb}
                    </p>
                    {entry.projectName && entry.action !== "project_created" && (
                      <p className="mt-0.5 text-[10px] text-zinc-400 font-mono truncate">
                        {entry.projectName}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <time
                    className="shrink-0 text-[10px] text-zinc-400 font-mono"
                    dateTime={new Date(entry.createdAt).toISOString()}
                  >
                    {relativeTime(entry.createdAt)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}
