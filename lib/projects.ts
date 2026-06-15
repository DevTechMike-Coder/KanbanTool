import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  type LucideIcon,
} from "lucide-react";

export type WorkflowNodeStatus = "done" | "active" | "blocked" | "up-next";
export type DependencyMode = "Required" | "Partial" | "Open";

export type WorkflowNode = {
  id: string;
  title: string;
  status: WorkflowNodeStatus;
  owner: string;
  output: string;
  dependency: DependencyMode;
  supportTeam: string[];
  forwardTeam: string[];
  blocker?: string;
  mappedColumn?: string;
};

export type Project = {
  id: string;
  name: string;
  summary: string;
  productGoal: string;
  currentNodeId: string;
  nodes: WorkflowNode[];
};

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

export const statusConfig: Record<
  WorkflowNodeStatus,
  {
    label: string;
    icon: LucideIcon;
    dotClass: string;
    badgeClass: string;
    panelClass: string;
  }
> = {
  done: {
    label: "Done",
    icon: CheckCircle2,
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
    panelClass: "border-emerald-200 bg-emerald-50/30",
  },
  active: {
    label: "Team here",
    icon: CircleDot,
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
    panelClass: "border-blue-200 bg-blue-50/30",
  },
  blocked: {
    label: "Stuck",
    icon: AlertTriangle,
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
    panelClass: "border-amber-200 bg-amber-50/40",
  },
  "up-next": {
    label: "Up next",
    icon: Clock3,
    dotClass: "bg-zinc-300",
    badgeClass: "bg-zinc-50 text-zinc-600 border-zinc-200",
    panelClass: "border-zinc-200 bg-white",
  },
};

export const projects: Project[] = [
  {
    id: "vertex-core",
    name: "Vertex Core App",
    summary: "Build the operational workspace for team planning and delivery.",
    productGoal:
      "A working app where teams can plan project paths, track blockers, and keep moving without losing ownership.",
    currentNodeId: "build-workflow",
    nodes: [
      {
        id: "scope",
        title: "Scope",
        status: "done",
        owner: "Michael",
        output: "Confirmed app direction, core users, and first workspace flows.",
        dependency: "Required",
        supportTeam: ["Michael"],
        forwardTeam: [],
      },
      {
        id: "design-system",
        title: "Design System",
        status: "done",
        owner: "Sarah",
        output: "Sidebar, cards, buttons, and workspace layout patterns.",
        dependency: "Required",
        supportTeam: ["Sarah"],
        forwardTeam: [],
      },
      {
        id: "build-workflow",
        title: "Workflow Graph",
        status: "active",
        owner: "Alex",
        output: "Project node path with owners, blockers, and outputs per stage.",
        dependency: "Partial",
        supportTeam: ["Alex", "Michael"],
        forwardTeam: ["Sarah"],
      },
      {
        id: "collaboration",
        title: "Team Split",
        status: "up-next",
        owner: "Sarah",
        output: "Rules for who stays on a blocker and who can move to the next node.",
        dependency: "Partial",
        supportTeam: [],
        forwardTeam: ["Sarah"],
      },
      {
        id: "release",
        title: "Release",
        status: "up-next",
        owner: "Michael",
        output: "Usable workspace with project paths and team handoff visibility.",
        dependency: "Required",
        supportTeam: [],
        forwardTeam: [],
      },
    ],
  },
  {
    id: "landing-design",
    name: "Landing Design",
    summary: "Create a focused landing experience for the Vertex workspace.",
    productGoal:
      "A polished landing page that explains the product clearly and routes users into the app.",
    currentNodeId: "visual-direction",
    nodes: [
      {
        id: "brief",
        title: "Brief",
        status: "done",
        owner: "Jessica",
        output: "Audience, promise, and conversion target defined.",
        dependency: "Required",
        supportTeam: ["Jessica"],
        forwardTeam: [],
      },
      {
        id: "wireframe",
        title: "Wireframe",
        status: "blocked",
        owner: "Michael",
        output: "Above-the-fold layout and page section order.",
        dependency: "Partial",
        supportTeam: ["Michael", "Alex"],
        forwardTeam: ["Jessica"],
        blocker: "Final product screenshots are not ready, so copy and layout need placeholder-safe sections.",
      },
      {
        id: "visual-direction",
        title: "Visual Direction",
        status: "active",
        owner: "Jessica",
        output: "Approved typography, image treatment, and CTA hierarchy.",
        dependency: "Partial",
        supportTeam: ["Jessica"],
        forwardTeam: ["Sarah"],
      },
      {
        id: "handoff",
        title: "Dev Handoff",
        status: "up-next",
        owner: "Sarah",
        output: "Responsive specs, assets, and implementation notes.",
        dependency: "Required",
        supportTeam: [],
        forwardTeam: [],
      },
    ],
  },
];

export function getProject(projectId: string) {
  return projects.find((project) => project.id === projectId);
}

