"use client";

import { useState } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCorners,
} from "@dnd-kit/core";
import { type Task, type ColumnId } from "@/lib/types/kanban";
import KanbanColumn from "@/components/kanban/KanbanColumn";
import { useToast } from "@/components/ui/toast";

const LANDING_COLUMNS = [
  { id: "todo" as ColumnId, title: "Todo", dotColor: "bg-blue-500" },
  { id: "in-progress" as ColumnId, title: "In Progress", dotColor: "bg-amber-500" },
  { id: "completed" as ColumnId, title: "Completed", dotColor: "bg-emerald-500" },
];

const INITIAL_TASKS: Task[] = [
  {
    id: "VTX-101",
    title: "Configure OAuth PKCE flows (Google & GitHub)",
    column: "todo",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
    labels: ["Auth", "Security"],
    comments: 2,
    files: 1,
    assignee: {
      id: "u1",
      name: "Mike Dev",
      email: "mike@dev.com",
      avatarUrl: null,
    },
  },
  {
    id: "VTX-102",
    title: "Implement drag-and-drop board with dnd-kit",
    column: "in-progress",
    priority: "critical",
    dueDate: new Date(),
    labels: ["UI/UX", "Interactive"],
    comments: 5,
    files: 3,
    assignee: {
      id: "u2",
      name: "Sarah Code",
      email: "sarah@code.com",
      avatarUrl: null,
    },
  },
  {
    id: "VTX-103",
    title: "Configure PostgreSQL connection pool",
    column: "completed",
    priority: "medium",
    dueDate: new Date(Date.now() - 86400000 * 3), // 3 days ago
    labels: ["Database", "Backend"],
    comments: 1,
    files: 0,
    assignee: {
      id: "u3",
      name: "Alex DB",
      email: "alex@db.com",
      avatarUrl: null,
    },
  },
];

export default function LandingKanban() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const nextColumn = over.id as ColumnId;
    if (!LANDING_COLUMNS.some((col) => col.id === nextColumn)) return;

    setTasks((curr) => {
      const moved = curr.find((t) => t.id === active.id);
      if (moved && moved.column !== nextColumn) {
        toast({
          title: "Optimistic Board Sync",
          message: `Successfully moved "${moved.title}" to ${over.id}. Sign in to save workspace state!`,
          type: "success",
        });
      }
      return curr.map((t) => (t.id === active.id ? { ...t, column: nextColumn } : t));
    });
  };

  const handleActionToast = () => {
    toast({
      title: "Interactive Workspace Preview",
      message: "This is a preview board. Sign up or log in to create and edit tasks, manage attachments, and add comments!",
      type: "neutral",
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-h-[500px] overflow-y-auto pr-1">
        {LANDING_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col.id);
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={colTasks}
              onAddTask={handleActionToast}
              onTaskClick={handleActionToast}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
