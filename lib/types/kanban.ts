// ─── Shared Kanban types ──────────────────────────────────────────────────────
// Single source of truth for all board-related shapes.
// Import from here instead of redefining inline.

export type ColumnId =
  | "backlog"
  | "todo"
  | "in-progress"
  | "review"
  | "completed";

export type Column = {
  id: ColumnId;
  title: string;
  dotColor: string;
};

export type TaskAssignee = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

export type TaskDependency = {
  id: string;
  title: string;
  column: string;
  priority: string;
};

export type Task = {
  id: string;
  title: string;
  column: ColumnId;
  comments: number;
  files: number;
  priority: string;
  dueDate: string | Date | null;
  labels: string[];
  assignee?: TaskAssignee | null;
  dependencies?: TaskDependency[];
  blockedTasks?: TaskDependency[];
};

export type Profile = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

export type Project = {
  id: string;
  name: string;
  summary: string | null;
  productGoal: string | null;
};

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

// Types for task detail modal
export type TaskComment = {
  id: string;
  text: string;
  taskId: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: Date | string;
};

export type TaskAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: Date | string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const COLUMNS: Column[] = [
  { id: "backlog",     title: "Backlog",     dotColor: "bg-zinc-400"   },
  { id: "todo",        title: "Todo",        dotColor: "bg-blue-500"   },
  { id: "in-progress", title: "In Progress", dotColor: "bg-amber-500"  },
  { id: "review",      title: "Review",      dotColor: "bg-purple-500" },
  { id: "completed",   title: "Completed",   dotColor: "bg-emerald-500"},
];

const LABEL_COLORS = [
  { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200"    },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200"   },
  { bg: "bg-purple-100",  text: "text-purple-700",  border: "border-purple-200"  },
  { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200"    },
  { bg: "bg-cyan-100",    text: "text-cyan-700",    border: "border-cyan-200"    },
  { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200"  },
  { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200"    },
];

export function getLabelColor(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) & 0xffffffff;
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}
