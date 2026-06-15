"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Calendar, MessageSquare, Paperclip } from "lucide-react";
import { type Task, getLabelColor } from "@/lib/types/kanban";

export default function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { column: task.column } });

  const style = { transform: CSS.Translate.toString(transform) };

  const displayName =
    task.assignee?.name ||
    task.assignee?.email?.split("@")[0] ||
    "Unassigned";
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "UN";

  const priorityConfigs: Record<string, { label: string; badgeClass: string }> =
    {
      critical: { label: "Critical", badgeClass: "text-red-755 bg-red-50 border-red-100" },
      high:     { label: "High",     badgeClass: "text-orange-755 bg-orange-50 border-orange-100" },
      medium:   { label: "Medium",   badgeClass: "text-blue-750 bg-blue-50 border-blue-100" },
      low:      { label: "Low",      badgeClass: "text-zinc-650 bg-zinc-55 border-zinc-200" },
    };

  const priorityMeta =
    priorityConfigs[task.priority?.toLowerCase() || "medium"] ||
    priorityConfigs.medium;

  const isBlocked =
    task.dependencies &&
    task.dependencies.length > 0 &&
    task.dependencies.some((dep) => dep.column !== "completed");

  return (
    <article
      ref={setNodeRef}
      style={style}
      onClick={() => { if (!isDragging) onClick(); }}
      className={`group rounded-lg border bg-white p-4 shadow-sm transition-all ${
        isBlocked
          ? "border-l-3 border-l-red-500 border-zinc-200 hover:border-zinc-300"
          : "border-zinc-200 hover:border-zinc-350"
      } ${isDragging ? "z-10 cursor-grabbing opacity-80 shadow-lg" : "cursor-pointer"}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {task.id}
          </span>
          {isBlocked && (
            <span className="inline-flex items-center gap-0.5 rounded-sm bg-red-50 border border-red-100 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-650">
              <AlertTriangle className="h-2.5 w-2.5" />
              Blocked
            </span>
          )}
        </div>
        <span className={`rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${priorityMeta.badgeClass}`}>
          {priorityMeta.label}
        </span>
      </div>

      <h3 className="mb-2 text-sm font-medium leading-snug text-zinc-800 group-hover:text-zinc-950">
        {task.title}
      </h3>

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.map((label) => {
            const c = getLabelColor(label);
            return (
              <span
                key={label}
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${c.bg} ${c.text} ${c.border}`}
              >
                {label}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-zinc-50 pt-2 text-zinc-450">
        <div className="flex items-center gap-2.5 text-[10px] font-medium text-zinc-500">
          {task.comments > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <MessageSquare aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-mono">{task.comments}</span>
            </div>
          )}
          {task.files > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Paperclip aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-mono">{task.files}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-zinc-500 shrink-0">
              <Calendar aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {new Date(task.dueDate).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {task.assignee ? (
          task.assignee.avatarUrl ? (
            <img
              src={task.assignee.avatarUrl}
              alt={displayName}
              className="h-5 w-5 rounded-full object-cover border border-white shadow-xs shrink-0"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-zinc-950 text-[8px] font-bold text-white shadow-xs shrink-0">
              {initials}
            </div>
          )
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-zinc-200 bg-zinc-50 text-[8px] font-medium text-zinc-400 shrink-0">
            --
          </div>
        )}
      </div>
    </article>
  );
}
