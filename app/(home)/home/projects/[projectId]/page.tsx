import { ProjectWorkflow } from "@/components/ProjectWorkflow";
import KanbanBoard from "@/components/KanbanBoard";
import { getProjectTeamMembers } from "@/app/actions/tasks";
import { getProject as getStaticProject } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { WorkflowNode, WorkflowNodeStatus, DependencyMode } from "@/lib/projects";
import { getSessionUserId } from "@/lib/auth/session";

interface CustomNodeState {
  status?: WorkflowNodeStatus;
  owner?: string;
  output?: string;
  dependency?: DependencyMode;
  supportTeam?: string[];
  forwardTeam?: string[];
  blocker?: string;
  mappedColumn?: string;
}

interface CustomWorkflowState {
  customNodes?: WorkflowNode[];
  [key: string]: CustomNodeState | WorkflowNode[] | undefined;
}

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const teamMembers = await getProjectTeamMembers(projectId);

  // 1. Fetch project from database
  const dbProject = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: true },
  });

  if (!dbProject) {
    notFound();
  }

  const userId = await getSessionUserId();
  let currentUser = null;
  let userTeams: Array<{ id: string; name: string }> = [];

  if (userId) {
    currentUser = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    // Fetch teams so KanbanBoard's create-project modal works if ever unlocked
    if (dbProject.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: dbProject.teamId },
        select: { id: true, name: true },
      });
      if (team) userTeams = [team];
    }
  }

  // Restrict access: a project tied to a workspace is only visible to members
  // of that workspace.
  if (dbProject.teamId) {
    const isMember = await prisma.team.findFirst({
      where: { id: dbProject.teamId, members: { some: { id: userId ?? "" } } },
      select: { id: true },
    });
    if (!isMember) {
      notFound();
    }
  }

  // 2. Parse custom workflow customizations (owners, blockers, deliverables)
  let customWorkflowState: CustomWorkflowState = {};
  if (dbProject.workflowState) {
    try {
      customWorkflowState = JSON.parse(dbProject.workflowState);
    } catch (e) {
      console.error("Failed to parse workflowState JSON metadata:", e);
    }
  }

  // 3. Fetch static project if it exists for pre-defined node paths
  const staticProj = getStaticProject(projectId);

  const tasks = dbProject.tasks;

  let baseNodes: WorkflowNode[] = [];

  if (
    customWorkflowState.customNodes &&
    Array.isArray(customWorkflowState.customNodes)
  ) {
    baseNodes = customWorkflowState.customNodes;
  } else if (staticProj) {
    baseNodes = staticProj.nodes;
  } else {
    baseNodes = [];
  }

  const columnOrder = ["backlog", "todo", "in-progress", "review", "completed"];

  function computeNodeStatus(
    nodeMappedColumn: string | undefined,
    projectTasks: { column: string }[],
    currentStatus: WorkflowNodeStatus,
    isFirstNode: boolean,
  ): WorkflowNodeStatus {
    if (!nodeMappedColumn || !columnOrder.includes(nodeMappedColumn)) {
      return currentStatus;
    }

    const nodeColIndex = columnOrder.indexOf(nodeMappedColumn);

    if (projectTasks.length === 0) {
      return isFirstNode ? "active" : "up-next";
    }

    if (projectTasks.some((t) => t.column === nodeMappedColumn)) {
      return "active";
    }

    const hasEarlier = projectTasks.some((t) => {
      const idx = columnOrder.indexOf(t.column);
      return idx !== -1 && idx < nodeColIndex;
    });
    if (hasEarlier) {
      return "up-next";
    }

    const allLater = projectTasks.every((t) => {
      const idx = columnOrder.indexOf(t.column);
      return idx !== -1 && idx > nodeColIndex;
    });
    if (allLater) {
      return "done";
    }

    return "up-next";
  }

  const updatedNodes = baseNodes.map((node, index) => {
    let status: WorkflowNodeStatus = node.status;
    let mappedCol = node.mappedColumn;

    if (!mappedCol) {
      if (node.id === "scope") mappedCol = "backlog";
      else if (
        node.id === "design-system" ||
        node.id === "wireframe" ||
        node.id === "design"
      )
        mappedCol = "todo";
      else if (
        node.id === "build-workflow" ||
        node.id === "visual-direction" ||
        node.id === "development"
      )
        mappedCol = "in-progress";
      else if (
        node.id === "collaboration" ||
        node.id === "handoff" ||
        node.id === "review"
      )
        mappedCol = "review";
      else if (node.id === "release") mappedCol = "completed";
    }

    if (mappedCol) {
      status = computeNodeStatus(mappedCol, tasks, status, index === 0);
    }

    const customNode = (customWorkflowState[node.id] as CustomNodeState) || {};
    let finalStatus =
      customNode.status !== undefined ? customNode.status : status;

    if (customNode.mappedColumn !== undefined) {
      finalStatus = computeNodeStatus(
        customNode.mappedColumn,
        tasks,
        finalStatus,
        index === 0,
      );
    }

    if (customNode.blocker && customNode.blocker.trim()) {
      finalStatus = "blocked";
    }

    return {
      ...node,
      owner: customNode.owner !== undefined ? customNode.owner : node.owner,
      output: customNode.output !== undefined ? customNode.output : node.output,
      dependency:
        customNode.dependency !== undefined
          ? customNode.dependency
          : node.dependency,
      supportTeam:
        customNode.supportTeam !== undefined
          ? customNode.supportTeam
          : node.supportTeam,
      forwardTeam:
        customNode.forwardTeam !== undefined
          ? customNode.forwardTeam
          : node.forwardTeam,
      blocker:
        customNode.blocker !== undefined ? customNode.blocker : node.blocker,
      mappedColumn:
        customNode.mappedColumn !== undefined
          ? customNode.mappedColumn
          : node.mappedColumn || mappedCol,
      status: finalStatus,
    };
  });

  const currentNodeId =
    updatedNodes.find((n) => n.status === "active")?.id ||
    updatedNodes.find((n) => n.status === "up-next")?.id ||
    (staticProj
      ? staticProj.currentNodeId
      : updatedNodes.length > 0
        ? updatedNodes[0].id
        : "scope");

  const projectData = {
    id: dbProject.id,
    name: dbProject.name,
    summary:
      dbProject.summary ||
      (staticProj
        ? staticProj.summary
        : "Custom project workspace mapped to live Kanban board tasks."),
    productGoal:
      dbProject.productGoal ||
      (staticProj
        ? staticProj.productGoal
        : "Release dynamic project milestones successfully."),
    currentNodeId,
    nodes: updatedNodes,
  };

  // Shape the project for KanbanBoard's projects prop
  const boardProject = {
    id: dbProject.id,
    name: dbProject.name,
    summary: dbProject.summary,
    productGoal: dbProject.productGoal,
  };

  return (
    <div className="flex flex-col pb-12 bg-white min-h-screen">
      {/* ── Workflow ─────────────────────────────────────────────── */}
      <ProjectWorkflow
        project={projectData}
        projectId={projectId}
        teamMembers={teamMembers}
      />

      {/* ── Project-scoped Kanban board ───────────────────────────── */}
      <div className="px-4 md:px-8">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <div className="h-px flex-1 bg-zinc-100" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Task Board
          </span>
          <div className="h-px flex-1 bg-zinc-100" />
        </div>

        <KanbanBoard
          projects={[boardProject]}
          lockedProjectId={projectId}
          currentUser={currentUser}
          userTeams={userTeams}
        />
      </div>
    </div>
  );
}
