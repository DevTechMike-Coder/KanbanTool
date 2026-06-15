"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  User,
  Trash2,
  Link2,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  addTaskDependency,
  removeTaskDependency,
  updateTaskColumn,
  updateTask,
} from "@/app/actions/tasks";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ColumnId = "backlog" | "todo" | "in-progress" | "review" | "completed";

type Task = {
  id: string;
  title: string;
  column: ColumnId;
  comments: number;
  files: number;
  priority: string;
  dueDate: string | Date | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  dependencies?: Array<{
    id: string;
    title: string;
    column: string;
    priority: string;
  }>;
  blockedTasks?: Array<{
    id: string;
    title: string;
    column: string;
    priority: string;
  }>;
};

const columns = [
  { id: "backlog" as ColumnId, title: "Backlog", dotColor: "bg-zinc-400" },
  { id: "todo" as ColumnId, title: "Todo", dotColor: "bg-blue-500" },
  {
    id: "in-progress" as ColumnId,
    title: "In Progress",
    dotColor: "bg-amber-500",
  },
  { id: "review" as ColumnId, title: "Review", dotColor: "bg-purple-500" },
  {
    id: "completed" as ColumnId,
    title: "Completed",
    dotColor: "bg-emerald-500",
  },
];

const priorityConfigs: Record<string, { label: string; badgeClass: string }> = {
  critical: {
    label: "Critical",
    badgeClass: "text-red-750 bg-red-50 border-red-100",
  },
  high: {
    label: "High",
    badgeClass: "text-orange-755 bg-orange-50 border-orange-100",
  },
  medium: {
    label: "Medium",
    badgeClass: "text-blue-750 bg-blue-50 border-blue-100",
  },
  low: { label: "Low", badgeClass: "text-zinc-600 bg-zinc-55 border-zinc-200" },
};

export default function DependencyGraph({
  projectId,
  tasks: initialTasks,
  profiles = [],
  currentUser = null,
  onRefresh,
}: {
  projectId: string;
  tasks: Task[];
  profiles?: any[];
  currentUser?: any;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [targetBlockerId, setTargetBlockerId] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Map tasks for lookup
  const tasksMap = useMemo(() => {
    return new Map(initialTasks.map((t) => [t.id, t]));
  }, [initialTasks]);

  // Selected task object
  const selectedTask = selectedTaskId ? tasksMap.get(selectedTaskId) : null;

  // Filter tasks based on search
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return initialTasks;
    const query = searchQuery.toLowerCase().trim();
    return initialTasks.filter((t) => {
      return (
        t.title.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.priority.toLowerCase().includes(query)
      );
    });
  }, [initialTasks, searchQuery]);

  // Determine blocked tasks. A task is blocked if ANY of its dependencies is NOT completed
  const isTaskBlocked = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    return task.dependencies.some((dep) => {
      const fullDep = tasksMap.get(dep.id);
      return fullDep
        ? fullDep.column !== "completed"
        : dep.column !== "completed";
    });
  };

  // Layout calculation
  const nodeWidth = 190;
  const nodeHeight = 85;

  const layout = useMemo(() => {
    // Calculate heights and positions dynamically
    const maxTasksInCol = Math.max(
      ...columns.map(
        (col) => filteredTasks.filter((t) => t.column === col.id).length,
      ),
      1,
    );

    const canvasHeight = Math.max(500, maxTasksInCol * 135 + 80);
    const canvasWidth = 1100;

    const columnXCoords: Record<ColumnId, number> = {
      backlog: 110,
      todo: 320,
      "in-progress": 530,
      review: 740,
      completed: 950,
    };

    const nodeCoords: Record<string, { x: number; y: number }> = {};

    columns.forEach((col) => {
      const colTasks = filteredTasks.filter((t) => t.column === col.id);
      const N = colTasks.length;
      colTasks.forEach((task, i) => {
        const spacing = canvasHeight / (N + 1);
        nodeCoords[task.id] = {
          x: columnXCoords[col.id],
          y: spacing * (i + 1),
        };
      });
    });

    return {
      canvasWidth,
      canvasHeight,
      nodeCoords,
    };
  }, [filteredTasks]);

  // Generate paths for rendering
  const connectionPaths = useMemo(() => {
    const paths: Array<{
      id: string;
      d: string;
      isActiveBlocker: boolean;
      isHighlighted: boolean;
      sourceId: string;
      targetId: string;
    }> = [];

    initialTasks.forEach((targetTask) => {
      const targetCoords = layout.nodeCoords[targetTask.id];
      if (!targetCoords) return;

      targetTask.dependencies?.forEach((dep) => {
        const sourceCoords = layout.nodeCoords[dep.id];
        if (!sourceCoords) return;

        const sourceTask = tasksMap.get(dep.id);
        const isActiveBlocker = sourceTask
          ? sourceTask.column !== "completed"
          : dep.column !== "completed";

        const x1 = sourceCoords.x + nodeWidth / 2;
        const y1 = sourceCoords.y;
        const x2 = targetCoords.x - nodeWidth / 2;
        const y2 = targetCoords.y;

        // Smooth Bezier path
        const controlOffset = Math.abs(x2 - x1) * 0.4;
        const d = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

        // Path is highlighted if either node is hovered, or if the path matches the selection context
        const isHighlighted =
          hoveredNodeId === targetTask.id ||
          hoveredNodeId === dep.id ||
          selectedTaskId === targetTask.id ||
          selectedTaskId === dep.id;

        paths.push({
          id: `${dep.id}->${targetTask.id}`,
          d,
          isActiveBlocker,
          isHighlighted,
          sourceId: dep.id,
          targetId: targetTask.id,
        });
      });
    });

    return paths;
  }, [
    initialTasks,
    layout.nodeCoords,
    tasksMap,
    hoveredNodeId,
    selectedTaskId,
  ]);

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !targetBlockerId) return;

    setIsLinking(true);
    try {
      await addTaskDependency(selectedTaskId, targetBlockerId);
      setTargetBlockerId("");
      toast({
        title: "Blocker Added",
        message: "Task dependency linked successfully.",
        type: "success",
      });
      if (onRefresh) onRefresh();
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Link Failed",
        message: err.message || "Failed to add task dependency.",
        type: "error",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    if (!selectedTaskId) return;

    try {
      await removeTaskDependency(selectedTaskId, dependencyId);
      toast({
        title: "Blocker Removed",
        message: "Task dependency severed.",
        type: "success",
      });
      if (onRefresh) onRefresh();
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Unlink Failed",
        message: err.message || "Failed to remove task dependency.",
        type: "error",
      });
    }
  };

  const handleStatusChange = async (newColumn: ColumnId) => {
    if (!selectedTaskId) return;

    try {
      await updateTaskColumn(selectedTaskId, newColumn);
      toast({
        title: "Status Updated",
        message: `Task column changed to ${newColumn}.`,
        type: "success",
      });
      if (onRefresh) onRefresh();
      router.refresh();
    } catch (err) {
      toast({
        title: "Update Failed",
        message: "Could not change task status.",
        type: "error",
      });
    }
  };

  // Eligible tasks to be chosen as blocker (cannot be itself or already dependency)
  const eligibleBlockers = useMemo(() => {
    if (!selectedTask) return [];
    const currentDepIds = new Set(
      selectedTask.dependencies?.map((d) => d.id) || [],
    );
    return initialTasks.filter(
      (t) =>
        t.id !== selectedTask.id &&
        !currentDepIds.has(t.id) &&
        t.column !== "completed",
    );
  }, [initialTasks, selectedTask]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* Dynamic Style injection for Flow animation */}
      <style>{`
        @keyframes dashflow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .active-blocker-path {
          stroke-dasharray: 6, 4;
          animation: dashflow 1.2s linear infinite;
        }
        .canvas-grid {
          background-image: radial-gradient(circle, #e4e4e7 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      {/* Main SVG/Graph Viewport */}
      <div className="flex-1 flex flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        {/* Controls header */}
        <div className="border-b border-zinc-200 bg-zinc-50/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-800">
              Dependency DAG Map
            </h3>
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-650">
              {filteredTasks.length} tasks
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search node title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-zinc-200 bg-white pl-8.5 pr-3 text-xs focus:border-zinc-950 focus:outline-hidden"
              />
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-lg border border-zinc-250 p-1.5 hover:bg-zinc-100 hover:text-zinc-900 text-zinc-500 cursor-pointer"
                title="Reload Graph"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Viewport canvas wrapper */}
        <div className="w-full overflow-x-auto p-4 scrollbar-thin">
          <div
            className="canvas-grid relative border border-zinc-150 rounded-xl bg-zinc-50/40"
            style={{
              width: `${layout.canvasWidth}px`,
              height: `${layout.canvasHeight}px`,
            }}
          >
            {/* Stage lane labels backgrounds */}
            <div className="absolute inset-y-0 left-0 w-full grid grid-cols-5 pointer-events-none divide-x divide-zinc-200/50">
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="relative h-full flex flex-col items-center pt-3"
                >
                  <div className="flex items-center gap-1.5 rounded-full bg-zinc-100/80 px-2.5 py-1 backdrop-blur-xs shadow-3xs border border-zinc-200/50">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${col.dotColor}`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {col.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* SVG Connections Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                width: `${layout.canvasWidth}px`,
                height: `${layout.canvasHeight}px`,
              }}
            >
              {/* Arrow Head markers definition */}
              <defs>
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="10"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#d4d4d8" />
                </marker>
                <marker
                  id="arrow-blocker"
                  viewBox="0 0 10 10"
                  refX="10"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f87171" />
                </marker>
                <marker
                  id="arrow-resolved"
                  viewBox="0 0 10 10"
                  refX="10"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#34d399" />
                </marker>
              </defs>

              {/* Render connector lines */}
              {connectionPaths.map((path) => {
                let strokeColor = "#e4e4e7"; // default gray
                let markerId = "arrow-default";

                if (path.isActiveBlocker) {
                  strokeColor = path.isHighlighted ? "#ef4444" : "#fca5a5"; // Active blocker: red/orange
                  markerId = "arrow-blocker";
                } else {
                  strokeColor = path.isHighlighted ? "#10b981" : "#a7f3d0"; // Resolved blocker: emerald/mint
                  markerId = "arrow-resolved";
                }

                return (
                  <g key={path.id}>
                    {/* Shadow highlight path underneath */}
                    {path.isHighlighted && (
                      <path
                        d={path.d}
                        fill="none"
                        stroke={path.isActiveBlocker ? "#fee2e2" : "#ecfdf5"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        opacity="0.75"
                      />
                    )}
                    {/* Main stroke path */}
                    <path
                      d={path.d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={path.isHighlighted ? "2.5" : "1.75"}
                      markerEnd={`url(#${markerId})`}
                      className={
                        path.isActiveBlocker ? "active-blocker-path" : ""
                      }
                    />
                  </g>
                );
              })}
            </svg>

            {/* Task Nodes */}
            {filteredTasks.map((task) => {
              const coords = layout.nodeCoords[task.id];
              if (!coords) return null;

              const isBlocked = isTaskBlocked(task);
              const isSelected = selectedTaskId === task.id;
              const isHovered = hoveredNodeId === task.id;

              const priorityMeta =
                priorityConfigs[task.priority?.toLowerCase() || "medium"] ||
                priorityConfigs.medium;

              // Border design based on status and blocker state
              let borderClass = "border-zinc-200 hover:border-zinc-350";
              if (isSelected) {
                borderClass =
                  "border-zinc-950 ring-2 ring-zinc-950/10 shadow-md";
              } else if (isBlocked) {
                borderClass =
                  "border-red-400 bg-red-50/10 hover:border-red-500 hover:shadow-xs";
              } else if (task.column === "completed") {
                borderClass =
                  "border-emerald-250 bg-emerald-50/10 hover:border-emerald-350";
              }

              // Double size for positioning top-left
              const style: React.CSSProperties = {
                position: "absolute",
                left: `${coords.x - nodeWidth / 2}px`,
                top: `${coords.y - nodeHeight / 2}px`,
                width: `${nodeWidth}px`,
                height: `${nodeHeight}px`,
              };

              return (
                <div
                  key={task.id}
                  style={style}
                  onMouseEnter={() => setHoveredNodeId(task.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`group select-none rounded-xl border bg-white p-3 shadow-3xs hover:shadow-2xs transition-all duration-200 cursor-pointer flex flex-col justify-between ${borderClass}`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono text-[9px] font-bold text-zinc-400 group-hover:text-zinc-500">
                      {task.id}
                    </span>
                    <span
                      className={`rounded-md border px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider ${priorityMeta.badgeClass}`}
                    >
                      {priorityMeta.label}
                    </span>
                  </div>

                  <h4 className="text-[11px] font-medium leading-snug text-zinc-800 line-clamp-2 pr-1 select-none">
                    {task.title}
                  </h4>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-1.5 text-[9px]">
                    <span className="text-zinc-450 truncate max-w-[90px] font-sans">
                      {task.assignee?.name ||
                        task.assignee?.email.split("@")[0] ||
                        "Unassigned"}
                    </span>
                    {isBlocked ? (
                      <span className="inline-flex items-center gap-0.5 font-bold uppercase text-red-600">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Blocked
                      </span>
                    ) : task.column === "completed" ? (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Done
                      </span>
                    ) : (
                      <span className="text-zinc-400 capitalize">
                        {task.column}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dependencies Inspector Sidebar */}
      <div className="w-full lg:w-80 shrink-0 bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-5 shadow-sm max-h-[600px] overflow-y-auto scrollbar-thin">
        {selectedTask ? (
          <>
            {/* Task header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-zinc-400">
                  {selectedTask.id}
                </span>
                <h3 className="text-sm font-bold text-zinc-950 mt-0.5 leading-snug">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-850 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Task Assignee and Column quick status toggles */}
            <div className="flex flex-col gap-2.5 text-xs border-b border-zinc-100 pb-4">
              <div>
                <span className="font-semibold text-zinc-500 block mb-1">
                  Status:
                </span>
                <Select
                  value={selectedTask.column}
                  onValueChange={(value) =>
                    handleStatusChange(value as ColumnId)
                  }
                  aria-label="Task status"
                >
                  <SelectTrigger className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-semibold text-zinc-700 focus:outline-hidden cursor-pointer text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="font-semibold text-zinc-500 block mb-1">
                  Priority:
                </span>
                <span
                  className={`inline-block border rounded-md px-2 py-0.5 font-bold uppercase tracking-wider text-[9px] ${
                    (
                      priorityConfigs[
                        selectedTask.priority?.toLowerCase() || "medium"
                      ] || priorityConfigs.medium
                    ).badgeClass
                  }`}
                >
                  {selectedTask.priority}
                </span>
              </div>
            </div>

            {/* Blocker/Dependencies List */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-zinc-500" />
                <span>
                  Blocked By ({selectedTask.dependencies?.length || 0})
                </span>
              </h4>

              {selectedTask.dependencies &&
              selectedTask.dependencies.length > 0 ? (
                <div className="space-y-2">
                  {selectedTask.dependencies.map((dep) => {
                    const fullDep = tasksMap.get(dep.id);
                    const isDone = fullDep
                      ? fullDep.column === "completed"
                      : dep.column === "completed";
                    const columnVal = fullDep ? fullDep.column : dep.column;

                    return (
                      <div
                        key={dep.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs gap-3 ${
                          isDone
                            ? "bg-emerald-50/20 border-emerald-100"
                            : "bg-red-50/15 border-red-100"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-[9px] font-bold text-zinc-400 block">
                            {dep.id}
                          </span>
                          <span
                            className="font-medium text-zinc-800 line-clamp-1"
                            title={dep.title}
                          >
                            {dep.title}
                          </span>
                          <span
                            className={`text-[9px] mt-0.5 font-semibold ${
                              isDone ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {isDone ? "Completed" : `Stuck in ${columnVal}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDependency(dep.id)}
                          className="rounded p-1 hover:bg-zinc-150 text-zinc-450 hover:text-red-650 transition-colors shrink-0 cursor-pointer"
                          title="Remove blocker link"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic bg-zinc-50 border border-dashed rounded-lg p-3 text-center">
                  This task has no blockers. It can run freely!
                </p>
              )}
            </div>

            {/* Add Blocker Dependency Selector */}
            <div className="border-t border-zinc-100 pt-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-zinc-500" />
                <span>Link a Blocker Task</span>
              </h4>

              {eligibleBlockers.length > 0 ? (
                <form onSubmit={handleAddDependency} className="space-y-2">
                  <Select
                    value={targetBlockerId}
                    onValueChange={(value) =>
                      setTargetBlockerId(value === "__none__" ? "" : value)
                    }
                    aria-label="Select task blocker"
                  >
                    <SelectTrigger className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-hidden cursor-pointer text-left">
                      <SelectValue placeholder="Select task..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select task...</SelectItem>
                      {eligibleBlockers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.id} - {t.title.slice(0, 30)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="submit"
                    disabled={isLinking || !targetBlockerId}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-850 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    {isLinking ? "Linking..." : "Link Selected Task"}
                  </button>
                </form>
              ) : (
                <p className="text-[10px] text-zinc-400 italic">
                  No other active tasks available to set as dependencies.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 min-h-60">
            <Link2 className="h-8 w-8 text-zinc-400 mb-2" />
            <p className="text-xs font-semibold text-zinc-800">
              No Task Selected
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Click any task node in the diagram to inspect its blockages and
              manage dependencies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
