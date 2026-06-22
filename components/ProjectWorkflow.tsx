"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Flag,
  GitBranch,
  PackageCheck,
  Users2,
  Edit2,
  X,
  Plus,
  Trash2,
  Check,
  Workflow,
} from "lucide-react";
import { updateProjectWorkflow } from "@/app/actions/tasks";
import {
  type Project,
  type WorkflowNode,
  type DependencyMode,
  type WorkflowNodeStatus,
  type TeamMember,
  statusConfig,
} from "@/lib/projects";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const generateNodeId = () => `node-${Date.now()}`;

// ─── Member chip multi-select ────────────────────────────────────────────────
function MemberMultiSelect({
  label,
  members,
  selected,
  onChange,
}: {
  label: string;
  members: TeamMember[];
  selected: string[];
  onChange: (names: string[]) => void;
}) {
  const toggle = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter((n) => n !== name)
        : [...selected, name],
    );
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-700">{label}</label>
        <input
          type="text"
          placeholder="e.g. Sarah, Michael"
          value={selected.join(", ")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden"
        />
        <p className="text-[10px] text-zinc-400">
          No team linked — type names manually.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-700">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/60 p-2 min-h-[38px]">
        {members.map((m) => {
          const name = m.name ?? m.email;
          const active = selected.includes(name);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(name)}
              className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                active
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {active && <Check className="h-2.5 w-2.5" />}
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Owner dropdown ───────────────────────────────────────────────────────────
function OwnerSelect({
  members,
  value,
  onChange,
}: {
  members: TeamMember[];
  value: string;
  onChange: (name: string) => void;
}) {
  if (members.length === 0) {
    return (
      <input
        type="text"
        placeholder="e.g. Alex Rivers"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden"
      />
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(value) =>
        onChange(value === "__unassigned__" ? "" : value)
      }
      aria-label="Stage owner"
    >
      <SelectTrigger className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer text-left">
        <SelectValue placeholder="— Unassigned —" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__unassigned__">— Unassigned —</SelectItem>
        {members.map((m) => {
          const name = m.name ?? m.email;
          return (
            <SelectItem key={m.id} value={name}>
              {name}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ─── Team pills display ───────────────────────────────────────────────────────
function TeamPills({ members }: { members: string[] }) {
  if (!members || members.length === 0) {
    return <span className="text-xs text-zinc-400">None assigned</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {members.map((member) => (
        <span
          key={member}
          className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600"
        >
          {member}
        </span>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyWorkflow({ onAddFirst }: { onAddFirst: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100">
        <Workflow className="h-7 w-7 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-900">
        No stages yet
      </h3>
      <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">
        Define your project path by adding workflow stages. Each stage maps to a
        Kanban column and tracks owners, outputs, and blockers.
      </p>
      <button
        type="button"
        onClick={onAddFirst}
        className="mt-5 flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-all cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Add First Stage
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ProjectWorkflow({
  project,
  projectId,
  teamMembers = [],
}: {
  project: Project;
  projectId: string;
  teamMembers?: TeamMember[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [modalMode, setModalMode] = useState<"edit" | "create">("edit");

  // Form state
  const [nodeTitle, setNodeTitle] = useState("");
  const [nodeStatus, setNodeStatus] = useState<WorkflowNodeStatus>("up-next");
  const [nodeMappedColumn, setNodeMappedColumn] = useState<string>("");
  const [nodeOwner, setNodeOwner] = useState("");
  const [nodeOutput, setNodeOutput] = useState("");
  const [nodeDependency, setNodeDependency] =
    useState<DependencyMode>("Required");
  const [nodeSupportTeam, setNodeSupportTeam] = useState<string[]>([]);
  const [nodeForwardTeam, setNodeForwardTeam] = useState<string[]>([]);
  const [nodeBlocker, setNodeBlocker] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentNode = project.nodes.find((n) => n.id === project.currentNodeId);
  const blockedNodes = project.nodes.filter((n) => n.status === "blocked");

  const openModal = (mode: "edit" | "create", node?: WorkflowNode) => {
    setModalMode(mode);
    if (mode === "edit" && node) {
      setSelectedNode(node);
      setNodeTitle(node.title || "");
      setNodeStatus(node.status || "up-next");
      setNodeMappedColumn(node.mappedColumn || "");
      setNodeOwner(node.owner || "");
      setNodeOutput(node.output || "");
      setNodeDependency(node.dependency || "Required");
      setNodeSupportTeam(node.supportTeam ?? []);
      setNodeForwardTeam(node.forwardTeam ?? []);
      setNodeBlocker(node.blocker || "");
    } else {
      setSelectedNode({
        id: generateNodeId(),
        title: "",
        status: "up-next",
        owner: "",
        output: "",
        dependency: "Required",
        supportTeam: [],
        forwardTeam: [],
      });
      setNodeTitle("");
      setNodeStatus("up-next");
      setNodeMappedColumn("");
      setNodeOwner("");
      setNodeOutput("");
      setNodeDependency("Required");
      setNodeSupportTeam([]);
      setNodeForwardTeam([]);
      setNodeBlocker("");
    }
    setIsModalOpen(true);
  };

  const persistWorkflow = async (nodes: WorkflowNode[]) => {
    const state: Record<string, unknown> = { customNodes: nodes };
    nodes.forEach((n) => {
      state[n.id] = {
        owner: n.owner,
        output: n.output,
        dependency: n.dependency,
        supportTeam: n.supportTeam,
        forwardTeam: n.forwardTeam,
        blocker: n.blocker,
        status: n.status,
        mappedColumn: n.mappedColumn,
      };
    });
    await updateProjectWorkflow(projectId, JSON.stringify(state));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || isSubmitting) return;
    setIsSubmitting(true);

    try {
      let updatedNodes: WorkflowNode[];

      const nodeData: WorkflowNode = {
        id: selectedNode.id,
        title: nodeTitle.trim() || "New Stage",
        status: nodeStatus,
        owner: nodeOwner.trim(),
        output: nodeOutput.trim(),
        dependency: nodeDependency,
        supportTeam: nodeSupportTeam,
        forwardTeam: nodeForwardTeam,
        blocker: nodeBlocker.trim() || undefined,
        mappedColumn: nodeMappedColumn || undefined,
      };

      if (modalMode === "create") {
        updatedNodes = [...project.nodes, nodeData];
      } else {
        updatedNodes = project.nodes.map((n) =>
          n.id === selectedNode.id ? { ...n, ...nodeData } : n,
        );
      }

      await persistWorkflow(updatedNodes);
      setIsModalOpen(false);
      router.refresh();
      toast({
        title: modalMode === "create" ? "Stage Created" : "Workflow Updated",
        message: `"${nodeData.title}" ${modalMode === "create" ? "added to" : "updated in"} your workflow.`,
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Save Failed",
        message: "Could not save workflow stage.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (
      !confirm(
        "Delete this stage? It will be removed from the workflow sequence.",
      )
    )
      return;
    setIsSubmitting(true);
    try {
      const updatedNodes = project.nodes.filter((n) => n.id !== nodeId);
      await persistWorkflow(updatedNodes);
      setIsModalOpen(false);
      router.refresh();
      toast({
        title: "Stage Deleted",
        message: "Workflow stage removed.",
        type: "success",
      });
    } catch {
      toast({
        title: "Delete Failed",
        message: "Could not delete stage.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-6 md:px-8 bg-white w-full font-sans">
      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <GitBranch className="h-4 w-4" />
            <span>Project Path</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 font-sans">
            {project.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500 font-sans">
            {project.summary}
          </p>
        </div>
        <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:max-w-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <PackageCheck className="h-4 w-4 text-zinc-500" />
            <span>End Product</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-650 font-sans">
            {project.productGoal}
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Team Location
          </span>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Users2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                {currentNode?.title ?? "No active node"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {currentNode
                  ? `${currentNode.owner || "Unassigned"} owns this stage`
                  : "Set a current node to show team focus"}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Stuck Work
          </span>
          <p className="mt-3 text-sm font-semibold text-zinc-950">
            {blockedNodes.length} blocked node
            {blockedNodes.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500 font-sans">
            Support stays on blocked work while forward team members continue
            where dependencies allow.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Path Rule
          </span>
          <p className="mt-3 text-sm font-semibold text-zinc-950">
            Partial dependencies can move
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500 font-sans">
            Required nodes hold the next step. Partial nodes allow a split team.
          </p>
        </div>
      </div>

      {/* Workflow nodes or empty state */}
      {project.nodes.length === 0 ? (
        <EmptyWorkflow onAddFirst={() => openModal("create")} />
      ) : (
        <div className="mt-8 overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex min-w-max items-stretch gap-3">
            {project.nodes.map((node, index) => {
              const config =
                statusConfig[node.status] || statusConfig["up-next"];
              const StatusIcon = config.icon;
              return (
                <div key={node.id} className="flex items-stretch gap-3">
                  <article
                    className={`group relative flex w-72 flex-col rounded-xl border p-4 shadow-sm bg-white transition-all hover:shadow-md ${config.panelClass}`}
                  >
                    <button
                      type="button"
                      onClick={() => openModal("edit", node)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 rounded-md p-1 hover:bg-zinc-100/80 text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer"
                      aria-label={`Edit ${node.title}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`}
                          />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Node {index + 1}
                          </span>
                        </div>
                        <h2 className="text-sm font-semibold text-zinc-950 truncate">
                          {node.title}
                        </h2>
                      </div>
                    </div>
                    <div className="mt-4 rounded-md border border-zinc-200/80 bg-white/80 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-950">
                        <Flag className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Output</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-zinc-650 min-h-10">
                        {node.output}
                      </p>
                    </div>
                    {node.blocker && (
                      <div className="mt-3 rounded-md border border-amber-250 bg-amber-50 p-3">
                        <p className="text-xs font-semibold text-amber-850">
                          Blocker
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-700 font-sans">
                          {node.blocker}
                        </p>
                      </div>
                    )}
                    <div className="mt-4 grid grid-cols-2 gap-3 flex-1">
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                          Support
                        </p>
                        <TeamPills members={node.supportTeam} />
                      </div>
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                          Forward
                        </p>
                        <TeamPills members={node.forwardTeam} />
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">
                        Owner:{" "}
                        <span className="font-semibold text-zinc-800">
                          {node.owner || "Unassigned"}
                        </span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.badgeClass}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                  </article>
                  {index < project.nodes.length - 1 && (
                    <div className="flex items-center text-zinc-350 px-1">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Stage card */}
            <div className="flex items-stretch pl-2">
              <button
                type="button"
                onClick={() => openModal("create")}
                className="flex w-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-350 text-zinc-500 hover:text-zinc-955 transition-all cursor-pointer gap-2 py-8 min-h-[300px]"
              >
                <Plus className="h-6 w-6 text-zinc-400" />
                <span className="text-xs font-semibold">Add Custom Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-zinc-950">
                {modalMode === "create"
                  ? "Add Workflow Stage"
                  : `Configure: ${selectedNode.title}`}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {modalMode === "create"
                  ? "Create a new stage in your project path."
                  : "Update ownership, outputs, and team assignments."}
              </p>
              {teamMembers.length > 0 && (
                <p className="mt-1 text-[10px] text-blue-600 font-medium">
                  {teamMembers.length} team member
                  {teamMembers.length === 1 ? "" : "s"} available to assign
                </p>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Stage name + status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="node-title"
                    className="text-xs font-semibold text-zinc-700"
                  >
                    Stage Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="node-title"
                    type="text"
                    required
                    placeholder="e.g. Design Blueprint"
                    value={nodeTitle}
                    onChange={(e) => setNodeTitle(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="node-status"
                    className="text-xs font-semibold text-zinc-700"
                  >
                    Stage Status
                  </label>
                  <Select
                    value={nodeStatus}
                    onValueChange={(value) =>
                      setNodeStatus(value as WorkflowNodeStatus)
                    }
                    aria-label="Stage status"
                  >
                    <SelectTrigger className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer text-left">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up-next">Up next</SelectItem>
                      <SelectItem value="active">Team here (Active)</SelectItem>
                      <SelectItem value="blocked">Stuck (Blocked)</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kanban column mapping */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="node-mapped-column"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Mapped Kanban Column
                </label>
                <Select
                  value={nodeMappedColumn}
                  onValueChange={(value) =>
                    setNodeMappedColumn(value === "__none__" ? "" : value)
                  }
                  aria-label="Mapped kanban column"
                >
                  <SelectTrigger className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer text-left">
                    <SelectValue placeholder="None (Manual Control)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      None (Manual Control)
                    </SelectItem>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-zinc-400">
                  Status auto-computes from tasks in the mapped column.
                </p>
              </div>

              {/* Owner + dependency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-700">
                    Stage Owner
                  </label>
                  <OwnerSelect
                    members={teamMembers}
                    value={nodeOwner}
                    onChange={setNodeOwner}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="node-dep"
                    className="text-xs font-semibold text-zinc-700"
                  >
                    Dependency Mode
                  </label>
                  <Select
                    value={nodeDependency}
                    onValueChange={(value) =>
                      setNodeDependency(value as DependencyMode)
                    }
                    aria-label="Dependency mode"
                  >
                    <SelectTrigger className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer text-left">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Required">Required</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Output */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="node-output"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Target Deliverable Output
                </label>
                <textarea
                  id="node-output"
                  rows={2}
                  placeholder="What must be delivered to clear this stage..."
                  value={nodeOutput}
                  onChange={(e) => setNodeOutput(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-955 focus:outline-hidden resize-none"
                />
              </div>

              {/* Support + Forward team pickers */}
              <div className="grid grid-cols-1 gap-4">
                <MemberMultiSelect
                  label="Support Team"
                  members={teamMembers}
                  selected={nodeSupportTeam}
                  onChange={setNodeSupportTeam}
                />
                <MemberMultiSelect
                  label="Forward Team"
                  members={teamMembers}
                  selected={nodeForwardTeam}
                  onChange={setNodeForwardTeam}
                />
              </div>

              {/* Blocker */}
              <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-4">
                <label
                  htmlFor="node-blocker"
                  className="text-xs font-semibold text-amber-700"
                >
                  Blocker (Optional)
                </label>
                <input
                  id="node-blocker"
                  type="text"
                  placeholder="e.g. Blocked by API designs not approved"
                  value={nodeBlocker}
                  onChange={(e) => setNodeBlocker(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-hidden text-amber-900"
                />
                <p className="text-[10px] text-zinc-400">
                  {"Adding a blocker automatically sets this node's status to \"Stuck\"."}
                </p>
              </div>

              {/* Footer actions */}
              <div className="mt-6 flex items-center justify-between gap-2.5 pt-4 border-t border-zinc-100">
                {modalMode === "edit" ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Stage
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !nodeTitle.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : modalMode === "create"
                        ? "Create Stage"
                        : "Save Config"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
