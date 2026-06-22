"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Layers, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getTasks,
  updateTaskColumn,
  createTask,
  getProjectMembers,
  createProject,
  deleteProject,
} from "@/app/actions/tasks";
import { useToast } from "@/components/ui/toast";
import DependencyGraph from "./DependencyGraph";
import { useAuthPrompt } from "@/lib/contexts/AuthPromptContext";

import KanbanColumn from "./kanban/KanbanColumn";
import FilterBar from "./kanban/FilterBar";
import TaskCreateModal from "./kanban/TaskCreateModal";
import ProjectCreateModal from "./kanban/ProjectCreateModal";
import TaskDetailModal from "./kanban/TaskDetailModal";

import {
  type Task,
  type ColumnId,
  type Profile,
  type CurrentUser,
  type Project,
  COLUMNS,
} from "@/lib/types/kanban";

// ─── Props ────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  projects?: Project[];
  lockedProjectId?: string;
  currentUser?: CurrentUser | null;
  userTeams?: Array<{ id: string; name: string }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KanbanBoard({
  projects = [],
  lockedProjectId,
  currentUser = null,
  userTeams = [],
}: KanbanBoardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { showAuthPrompt } = useAuthPrompt();

  // ── Project state ──────────────────────────────────────────────────────────
  const [projectsList, setProjectsList] = useState<Project[]>(projects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    lockedProjectId ?? projects[0]?.id ?? "",
  );
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // ── Task / profile state ───────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // ── Sync states on prop/state changes in render phase ──────────────────────
  const [prevLockedProjectId, setPrevLockedProjectId] = useState(lockedProjectId);
  if (lockedProjectId !== prevLockedProjectId) {
    setPrevLockedProjectId(lockedProjectId);
    if (lockedProjectId) {
      setSelectedProjectId(lockedProjectId);
    }
  }

  const [prevSelectedProjectId, setPrevSelectedProjectId] = useState(selectedProjectId);
  if (selectedProjectId !== prevSelectedProjectId) {
    setPrevSelectedProjectId(selectedProjectId);
    if (!selectedProjectId) {
      setTasks([]);
    }
  }

  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssigneeId, setFilterAssigneeId] = useState("");
  const [filterLabels, setFilterLabels] = useState<string[]>([]);

  // ── View mode ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"board" | "graph">("board");

  // ── Modal state ────────────────────────────────────────────────────────────
  const [createColumn, setCreateColumn] = useState<ColumnId | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ── DnD sensors ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  // ── Sync locked project (handled in render sync) ───────────────────────────

  // ── Fetch tasks + profiles when project changes ────────────────────────────
  const refreshTasks = () => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }
    getTasks(selectedProjectId).then((data) =>
      setTasks(
        data.map((t) => ({
          id: t.id,
          title: t.title,
          column: t.column as ColumnId,
          comments: t.comments,
          files: t.files,
          priority: t.priority || "medium",
          dueDate: t.dueDate,
          labels: t.labels ?? [],
          assignee: t.assignee,
          dependencies: t.dependencies,
          blockedTasks: t.blockedTasks,
        })),
      ),
    );
  };

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }
    let active = true;

    getTasks(selectedProjectId).then((data) => {
      if (!active) return;
      setTasks(
        data.map((t) => ({
          id: t.id,
          title: t.title,
          column: t.column as ColumnId,
          comments: t.comments,
          files: t.files,
          priority: t.priority || "medium",
          dueDate: t.dueDate,
          labels: t.labels ?? [],
          assignee: t.assignee,
          dependencies: t.dependencies,
          blockedTasks: t.blockedTasks,
        })),
      );
    });

    getProjectMembers(selectedProjectId).then((data) => {
      if (active) setProfiles(data as Profile[]);
    });

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  // ── Filtered + grouped tasks ───────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const assigneeName =
          task.assignee?.name || task.assignee?.email?.split("@")[0] || "";
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.id.toLowerCase().includes(q) &&
          !task.priority?.toLowerCase().includes(q) &&
          !assigneeName.toLowerCase().includes(q) &&
          !task.labels?.some((l) => l.toLowerCase().includes(q))
        )
          return false;
      }
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterAssigneeId) {
        if (filterAssigneeId === "__unassigned__") {
          if (task.assignee) return false;
        } else if (task.assignee?.id !== filterAssigneeId) return false;
      }
      if (
        filterLabels.length > 0 &&
        !filterLabels.every((fl) => task.labels?.includes(fl))
      )
        return false;
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterAssigneeId, filterLabels]);

  const tasksByColumn = useMemo(
    () =>
      COLUMNS.reduce<Record<ColumnId, Task[]>>(
        (acc, col) => {
          acc[col.id] = filteredTasks.filter((t) => t.column === col.id);
          return acc;
        },
        { backlog: [], todo: [], "in-progress": [], review: [], completed: [] },
      ),
    [filteredTasks],
  );

  // ── Drag & drop — optimistic with typed revert ─────────────────────────────
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const nextColumn = over.id as ColumnId;
    if (!COLUMNS.some((col) => col.id === nextColumn)) return;

    const previousTasks = tasks; // snapshot for revert

    // Optimistic update — instant UI feedback
    setTasks((curr) =>
      curr.map((t) => (t.id === active.id ? { ...t, column: nextColumn } : t)),
    );

    try {
      await updateTaskColumn(active.id as string, nextColumn);
      const movedTask = previousTasks.find((t) => t.id === active.id);
      toast({
        title: "Task Moved",
        message: `"${movedTask?.title ?? "Task"}" moved to ${nextColumn}.`,
        type: "success",
      });
    } catch (err) {
      // Hard revert to pre-drag snapshot — no flash
      setTasks(previousTasks);
      toast({
        title: "Move Failed",
        message: "Failed to update task position.",
        type: "error",
      });
    }
  }

  // ── Task CRUD handlers ─────────────────────────────────────────────────────
  async function handleCreateTask(data: {
    title: string;
    priority: string;
    dueDate: Date | null;
  }) {
    if (!createColumn) return;
    const newTask = await createTask(
      selectedProjectId,
      data.title,
      createColumn,
      data.priority,
      data.dueDate,
    );
    setTasks((curr) => [
      ...curr,
      {
        id: newTask.id,
        title: newTask.title,
        column: newTask.column as ColumnId,
        comments: newTask.comments,
        files: newTask.files,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        labels: [],
        assignee: null,
      },
    ]);
    setCreateColumn(null);
    toast({
      title: "Task Created",
      message: `"${newTask.title}" added.`,
      type: "success",
    });
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((curr) => curr.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask((prev) => (prev?.id === updated.id ? updated : prev));
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((curr) => curr.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  }

  // ── Project CRUD ───────────────────────────────────────────────────────────
  async function handleCreateProject(data: {
    name: string;
    summary: string;
    goal: string;
    teamId: string;
  }) {
    const created = await createProject(
      data.name,
      data.summary,
      data.goal,
      data.teamId || undefined,
    );
    setProjectsList((prev) => [...prev, created]);
    setSelectedProjectId(created.id);
    setIsProjectModalOpen(false);
    toast({
      title: "Project Created",
      message: `"${created.name}" is ready.`,
      type: "success",
    });
    router.refresh();
  }

  async function handleDeleteProject() {
    if (!selectedProjectId) return;
    const project = projectsList.find((p) => p.id === selectedProjectId);
    if (!project) return;
    if (!confirm(`Delete "${project.name}"? This also deletes all its tasks.`))
      return;

    try {
      await deleteProject(selectedProjectId);
      const updated = projectsList.filter((p) => p.id !== selectedProjectId);
      setProjectsList(updated);
      setSelectedProjectId(updated[0]?.id ?? "");
      toast({
        title: "Project Deleted",
        message: "Project removed successfully.",
        type: "success",
      });
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not delete project.";
      toast({ title: "Deletion Failed", message: msg, type: "error" });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section aria-label="Project kanban board" className="w-full">
      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-zinc-150 pb-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
            Project Board & Canvas
          </h2>
          <div className="inline-flex self-start items-center rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/50">
            {(["board", "graph"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-white text-zinc-950 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {mode === "board" ? "Board View" : "Dependency Map"}
              </button>
            ))}
          </div>
        </div>

        {/* Action and Filter Controls Group Container */}
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {/* Filters Context — aligns inline fields explicitly */}
          {viewMode === "board" && (
            <div className="flex flex-wrap items-center gap-2">
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterPriority={filterPriority}
                onPriorityChange={setFilterPriority}
                filterAssigneeId={filterAssigneeId}
                onAssigneeChange={setFilterAssigneeId}
                filterLabels={filterLabels}
                onLabelsChange={setFilterLabels}
                profiles={profiles}
                tasks={tasks}
              />
            </div>
          )}

          {/* Project actions context segment */}
          {!lockedProjectId && (
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-1 lg:border-l lg:pl-3">
              {projectsList.length > 0 ? (
                <>
                  <label
                    htmlFor="project-select"
                    className="text-xs font-semibold text-zinc-500 whitespace-nowrap"
                  >
                    Active Project:
                  </label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    aria-label="Active project"
                  >
                    <SelectTrigger className="h-8 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 focus:border-zinc-950 focus:outline-hidden transition-all shadow-sm cursor-pointer text-left">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        showAuthPrompt();
                      } else {
                        setIsProjectModalOpen(true);
                      }
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
                    title="Add new project"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        showAuthPrompt();
                      } else {
                        handleDeleteProject();
                      }
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-650 hover:text-red-650 hover:bg-red-50 transition-colors shadow-2xs cursor-pointer"
                    title="Delete active project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 italic">
                    No projects available
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        showAuthPrompt();
                      } else {
                        setIsProjectModalOpen(true);
                      }
                    }}
                    className="flex h-8 items-center gap-1 px-3 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Board / Graph / Empty Workspaces ────────────────────────────────── */}
      {projectsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
          <Layers className="h-10 w-10 text-zinc-300 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-900">
            No Projects Found
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center">
            Create your first project to start planning, managing tasks, and
            tracking workflows.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                showAuthPrompt();
              } else {
                setIsProjectModalOpen(true);
              }
            }}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-xs font-semibold text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New Project
          </button>
        </div>
      ) : viewMode === "board" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className="flex gap-4">
              {COLUMNS.map((column) => (
                <div key={column.id} className="w-72 shrink-0">
                  <KanbanColumn
                    column={column}
                    tasks={tasksByColumn[column.id]}
                    onAddTask={() => {
                      if (!currentUser) {
                        showAuthPrompt();
                      } else {
                        setCreateColumn(column.id);
                      }
                    }}
                    onTaskClick={setSelectedTask}
                  />
                </div>
              ))}
            </div>
          </div>
        </DndContext>
      ) : (
        <div className="w-full">
          <DependencyGraph
            projectId={selectedProjectId}
            tasks={tasks}
            profiles={profiles}
            currentUser={currentUser}
            onRefresh={refreshTasks}
          />
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {createColumn && (
        <TaskCreateModal
          column={createColumn}
          onClose={() => setCreateColumn(null)}
          onSubmit={handleCreateTask}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          tasks={tasks}
          profiles={profiles}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
 
          onTaskDeleted={handleTaskDeleted}
        />
      )}

      {isProjectModalOpen && (
        <ProjectCreateModal
          userTeams={userTeams}
          onClose={() => setIsProjectModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </section>
  );
}