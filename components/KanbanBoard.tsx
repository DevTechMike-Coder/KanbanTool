"use client";

import { useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, MoreHorizontal, Paperclip, Plus } from "lucide-react";

type ColumnId = "backlog" | "todo" | "in-progress" | "review" | "completed";

type Column = {
  id: ColumnId;
  title: string;
  dotColor: string;
};

type Task = {
  id: string;
  title: string;
  column: ColumnId;
  comments: number;
  files: number;
};

const columns: Column[] = [
  { id: "backlog", title: "Backlog", dotColor: "bg-zinc-400" },
  { id: "todo", title: "Todo", dotColor: "bg-blue-500" },
  { id: "in-progress", title: "In Progress", dotColor: "bg-amber-500" },
  { id: "review", title: "Review", dotColor: "bg-purple-500" },
  { id: "completed", title: "Completed", dotColor: "bg-emerald-500" },
];

const initialTasks: Task[] = [
  {
    id: "VTX-101",
    title: "Configure WebSocket auth handshake",
    column: "in-progress",
    comments: 4,
    files: 2,
  },
  {
    id: "VTX-102",
    title: "Fix layout scaling on Overview sidebar",
    column: "todo",
    comments: 1,
    files: 0,
  },
  {
    id: "VTX-103",
    title: "Draft system architecture docs",
    column: "backlog",
    comments: 0,
    files: 3,
  },
  {
    id: "VTX-104",
    title: "Audit environment variable rotation pipeline",
    column: "review",
    comments: 7,
    files: 1,
  },
  {
    id: "VTX-105",
    title: "Polish dashboard empty states",
    column: "completed",
    comments: 2,
    files: 0,
  },
];

function KanbanColumn({
  column,
  tasks,
}: {
  column: Column;
  tasks: Task[];
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

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
          <h2 className="text-sm font-semibold text-zinc-900">
            {column.title}
          </h2>
          <span className="shrink-0 rounded-md bg-zinc-200/60 px-1.5 py-0.5 font-mono text-xs font-medium text-zinc-400">
            {tasks.length}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-zinc-400">
          <button
            type="button"
            aria-label={`Add task to ${column.title}`}
            className="rounded p-1 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`${column.title} options`}
            className="rounded p-1 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex max-h-[calc(100vh-260px)] flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white/50 px-4 text-center text-xs font-medium text-zinc-400">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: {
        column: task.column,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 ${
        isDragging
          ? "z-10 cursor-grabbing opacity-80 shadow-lg"
          : "cursor-grab"
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        {task.id}
      </div>

      <h3 className="mb-4 text-sm font-medium leading-snug text-zinc-800 group-hover:text-zinc-950">
        {task.title}
      </h3>

      <div className="flex items-center justify-between border-t border-zinc-50 pt-2 text-zinc-400">
        <div className="flex items-center gap-3 text-xs">
          {task.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px]">{task.comments}</span>
            </div>
          )}
          {task.files > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px]">{task.files}</span>
            </div>
          )}
        </div>

        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-zinc-900 text-[9px] font-bold text-white shadow-sm">
          M
        </div>
      </div>
    </article>
  );
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const tasksByColumn = useMemo(() => {
    return columns.reduce<Record<ColumnId, Task[]>>(
      (acc, column) => {
        acc[column.id] = tasks.filter((task) => task.column === column.id);
        return acc;
      },
      {
        backlog: [],
        todo: [],
        "in-progress": [],
        review: [],
        completed: [],
      }
    );
  }, [tasks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const nextColumn = over.id as ColumnId;

    if (!columns.some((column) => column.id === nextColumn)) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === active.id ? { ...task, column: nextColumn } : task
      )
    );
  }

  return (
    <section aria-label="Project kanban board" className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
            Project Board
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Drag tasks between columns to update their status.
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:min-w-max 2xl:grid-cols-5">
            {columns.map((column) => (
              <div key={column.id} className="w-full 2xl:w-72">
                <KanbanColumn
                  column={column}
                  tasks={tasksByColumn[column.id]}
                />
              </div>
            ))}
          </div>
        </div>
      </DndContext>
    </section>
  );
}
