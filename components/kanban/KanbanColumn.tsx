"use client";

import { useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { MoreHorizontal, Plus } from "lucide-react";
import TaskCard from "./TaskCard";
import { type Column, type Task } from "@/lib/types/kanban";
import { gsap, useGSAP, EASE, prefersReducedMotion, showWithoutMotion } from "@/lib/gsap";

export default function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onTaskClick,
}: {
  column: Column;
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });
  const listRef = useRef<HTMLDivElement>(null);

  // Stagger task cards in on initial mount.
  useGSAP(
    () => {
      if (!listRef.current) return;
      const cards = listRef.current.querySelectorAll("[data-task-card]");
      if (!cards.length) return;

      if (prefersReducedMotion()) {
        showWithoutMotion(cards);
        return;
      }

      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: EASE.smooth,
          stagger: 0.05,
          clearProps: "transform,opacity,visibility",
        },
      );
    },
    { dependencies: [], scope: listRef },
  );

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[500px] flex-col rounded-xl border p-3 transition-colors ${
        isOver
          ? "border-indigo-300 bg-indigo-50/60"
          : "border-zinc-200/80 bg-zinc-100/60"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${column.dotColor}`} />
          <h2 className="text-sm font-semibold text-zinc-900">{column.title}</h2>
          <span className="shrink-0 rounded-md bg-zinc-200/60 px-1.5 py-0.5 font-mono text-xs font-medium text-zinc-400">
            {tasks.length}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-zinc-400">
          <button
            type="button"
            onClick={onAddTask}
            aria-label={`Add task to ${column.title}`}
            className="rounded p-1 transition-colors hover:bg-zinc-250 hover:text-zinc-600 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`${column.title} options`}
            className="rounded p-1 transition-colors hover:bg-zinc-250 hover:text-zinc-600 cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex max-h-[calc(100vh-260px)] flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5 scrollbar-thin"
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white/50 px-4 text-center text-xs font-medium text-zinc-400">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
}
