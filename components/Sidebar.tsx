"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderGit2,
  Home,
  Plus,
  Users,
  Menu,
  X,
  Settings,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import VertexIcon from "./iconComp/Vertex";
import SidebarIcon from "./iconComp/SidebarIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject } from "@/app/actions/tasks";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useAuthPrompt } from "@/lib/contexts/AuthPromptContext";

const primaryNavItems: Array<{
  icon: LucideIcon;
  label: string;
  href: string;
}> = [
  { icon: Home, label: "Overview", href: "/home" },
  { icon: Users, label: "Team Collaboration", href: "/teams" },
];

interface DbProject {
  id: string;
  name: string;
  summary: string | null;
  productGoal: string | null;
}

interface SidebarProps {
  user?: {
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  } | null;
  initialProjects?: DbProject[];
  userTeams?: Array<{ id: string; name: string }>;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({
  user,
  initialProjects = [],
  userTeams = [],
  onCollapseChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { showAuthPrompt } = useAuthPrompt();

  // Navigation & UI States
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [projectsList, setProjectsList] =
    useState<DbProject[]>(initialProjects);

  const [prevInitialProjects, setPrevInitialProjects] = useState(initialProjects);
  if (initialProjects !== prevInitialProjects) {
    setPrevInitialProjects(initialProjects);
    setProjectsList(initialProjects);
  }

  // Project Creation Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSummary, setNewProjectSummary] = useState("");
  const [newProjectGoal, setNewProjectGoal] = useState("");
  const [newProjectTeamId, setNewProjectTeamId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<
    string | null
  >(null);

  const displayName = user?.name || user?.email?.split("@")[0] || "Michael";
  const displayEmail = user?.email || "dev@vertexcanvas.com";

  // Calculate initials
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME";

  // Sync projects state if initialProjects changes (handled in render synchronization)

  // Toggle Collapse State Handler
  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (onCollapseChange) {
      onCollapseChange(nextState);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    if (userTeams.length === 0) {
      setCreateProjectError(
        "You need to create or join a workspace before you can create a project.",
      );
      return;
    }

    if (!newProjectTeamId) {
      setCreateProjectError(
        "Please select a workspace to assign this project to.",
      );
      return;
    }

    setCreateProjectError(null);
    setIsSubmitting(true);
    try {
      const newProj = await createProject(
        newProjectName.trim(),
        newProjectSummary.trim() || undefined,
        newProjectGoal.trim() || undefined,
        newProjectTeamId || undefined,
      );

      setProjectsList((prev) => [...prev, newProj]);
      setIsProjectModalOpen(false);
      setNewProjectName("");
      setNewProjectSummary("");
      setNewProjectGoal("");
      setNewProjectTeamId("");

      router.refresh();
      router.push(`/home/projects/${newProj.id}`);
    } catch (err) {
      console.error("Failed to create project", err);
      setCreateProjectError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the project. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className="fixed top-0 left-0 right-0 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden z-30 shadow-xs">
        <Link href="/" className="flex items-center gap-2">
          <VertexIcon />
          <span className="text-sm font-bold tracking-tight text-zinc-950">
            Vertex Canvas
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 hidden h-screen flex-col justify-between border-r border-zinc-200 bg-white transition-all duration-300 ease-in-out md:flex z-30 ${
          isCollapsed ? "w-16 p-3" : "w-64 p-4"
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Sidebar Top Header Row */}
          <div
            className={`flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-2"}`}
          >
            {/* Logo and Brand Name only visible when NOT collapsed */}
            {!isCollapsed && (
              <Link
                href="/"
                className="flex min-w-0 items-center gap-2 animate-fade-in"
              >
                <VertexIcon />
                <span className="truncate text-lg font-bold tracking-tight text-zinc-950">
                  Vertex Canvas
                </span>
              </Link>
            )}

            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  aria-label={
                    isCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                  className="rounded-md p-1 text-zinc-500 transition-all hover:bg-zinc-100 hover:text-indigo-600 cursor-pointer"
                >
                  <div
                    className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
                  >
                    <SidebarIcon size={22} />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                <p>{isCollapsed ? "Expand sidebar" : "Close the sidebar"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation Systems Area */}
          <nav aria-label="Main Navigation" className="flex flex-col gap-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Tooltip
                  key={item.href}
                  delayDuration={isCollapsed ? 200 : 1000}
                >
                  <TooltipTrigger asChild>
                    <Link
                      href={(!user && item.href !== "/home") ? "#" : item.href}
                      onClick={(e) => {
                        if (!user && item.href !== "/home") {
                          e.preventDefault();
                          showAuthPrompt();
                        }
                      }}
                      className={
                        isActive
                          ? `flex items-center rounded-lg bg-zinc-950 text-sm font-medium text-white shadow-sm transition-colors ${
                              isCollapsed
                                ? "h-10 w-10 justify-center p-0 mx-auto"
                                : "w-full gap-3 px-3 py-2.5"
                            }`
                          : `flex items-center rounded-lg text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 ${
                              isCollapsed
                                ? "h-10 w-10 justify-center p-0 mx-auto"
                                : "w-full gap-3 px-3 py-2.5"
                            }`
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate animate-fade-in">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" sideOffset={12}>
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}

            {/* Dynamic Projects Iteration Frame */}
            <div className="mt-6 flex flex-col gap-1">
              <div
                className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
              >
                {!isCollapsed && (
                  <span className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-400 animate-fade-in">
                    Projects
                  </span>
                )}

                <Tooltip delayDuration={isCollapsed ? 200 : 1000}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          showAuthPrompt();
                        } else {
                          setCreateProjectError(null);
                          setIsProjectModalOpen(true);
                        }
                      }}
                      className={`rounded-md p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-950 transition-colors cursor-pointer ${
                        isCollapsed ? "mx-auto mb-1" : ""
                      }`}
                      aria-label="Add project"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" sideOffset={12}>
                      <p>Create New Project</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>

              {projectsList.map((project) => {
                const href = `/home/projects/${project.id}`;
                const isActive = pathname === href;

                return (
                  <Tooltip
                    key={project.id}
                    delayDuration={isCollapsed ? 200 : 1000}
                  >
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        className={
                          isActive
                            ? `mt-1 flex items-center rounded-lg bg-zinc-950 text-sm font-medium text-white shadow-sm transition-colors ${
                                isCollapsed
                                  ? "h-9 w-9 justify-center p-0 mx-auto"
                                  : "w-full gap-3 px-3 py-2"
                              }`
                            : `mt-1 flex items-center rounded-lg text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 ${
                                isCollapsed
                                  ? "h-9 w-9 justify-center p-0 mx-auto"
                                  : "w-full gap-3 px-3 py-2"
                              }`
                        }
                      >
                        <FolderGit2
                          className={
                            isActive
                              ? "h-4 w-4 shrink-0 text-white"
                              : "h-4 w-4 shrink-0 text-zinc-400"
                          }
                        />
                        {!isCollapsed && (
                          <span className="truncate animate-fade-in">
                            {project.name}
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" sideOffset={12}>
                        <p>{project.name}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </nav>
        </div>

        {/* User Workspace Profile Footer Group */}
        {user ? (
          <div
            className={`flex border-t border-zinc-200 pt-4 ${isCollapsed ? "flex-col items-center gap-3 px-0" : "items-center justify-between px-2"}`}
          >
            <div
              className={`flex min-w-0 items-center ${isCollapsed ? "justify-center" : "gap-3"}`}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white shrink-0">
                  {initials}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex min-w-0 flex-col animate-fade-in">
                  <span className="truncate text-xs font-semibold text-zinc-950">
                    {displayName}
                  </span>
                  <span className="truncate text-[10px] text-zinc-400">
                    {displayEmail}
                  </span>
                </div>
              )}
            </div>

            <Tooltip delayDuration={isCollapsed ? 200 : 1000}>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="h-4.5 w-4.5" />
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={12}>
                  <p>Settings</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        ) : (
          <div
            className={`border-t border-zinc-200 pt-4 flex flex-col gap-2 ${isCollapsed ? "px-0 items-center" : "px-2"}`}
          >
            <Tooltip delayDuration={isCollapsed ? 200 : 1000}>
              <TooltipTrigger asChild>
                <Link
                  href="/signUp"
                  className={`flex items-center justify-center rounded-lg bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 transition-all shadow-sm ${
                    isCollapsed ? "h-8 w-8 p-0" : "w-full px-4 py-2.5"
                  }`}
                >
                  {isCollapsed ? <Plus className="h-4 w-4" /> : "Sign Up"}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={12}>
                  <p>Sign Up</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip delayDuration={isCollapsed ? 200 : 1000}>
              <TooltipTrigger asChild>
                <Link
                  href="/signIn"
                  className={`flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 transition-all ${
                    isCollapsed ? "h-8 w-8 p-0" : "w-full px-4 py-2.5"
                  }`}
                >
                  {isCollapsed ? <Users className="h-4 w-4" /> : "Sign In"}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={12}>
                  <p>Sign In</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer container */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-zinc-200 bg-white p-4 shadow-xl transition-all duration-300">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between px-2">
                <Link
                  href="/"
                  className="flex min-w-0 items-center gap-2"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <VertexIcon />
                  <span className="truncate text-lg font-bold tracking-tight text-zinc-950">
                    Vertex Canvas
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav
                aria-label="Mobile Main Navigation"
                className="flex flex-col gap-1"
              >
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={(!user && item.href !== "/home") ? "#" : item.href}
                      onClick={(e) => {
                        setIsMobileOpen(false);
                        if (!user && item.href !== "/home") {
                          e.preventDefault();
                          showAuthPrompt();
                        }
                      }}
                      className={
                        isActive
                          ? "flex w-full items-center gap-3 rounded-lg bg-zinc-950 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors"
                          : "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="mt-6 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Projects
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileOpen(false);
                        if (!user) {
                          showAuthPrompt();
                        } else {
                          setCreateProjectError(null);
                          setIsProjectModalOpen(true);
                        }
                      }}
                      className="rounded-md p-1 text-zinc-450 hover:bg-zinc-100 hover:text-zinc-800 transition-colors cursor-pointer"
                      aria-label="Add project"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {projectsList.map((project) => {
                    const href = `/home/projects/${project.id}`;
                    const isActive = pathname === href;

                    return (
                      <Link
                        key={project.id}
                        href={href}
                        onClick={() => setIsMobileOpen(false)}
                        className={
                          isActive
                            ? "mt-1 flex w-full items-center gap-3 rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors"
                            : "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
                        }
                      >
                        <FolderGit2
                          className={
                            isActive
                              ? "h-4 w-4 shrink-0 text-white"
                              : "h-4 w-4 shrink-0 text-zinc-400"
                          }
                        />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            {user ? (
              <div className="flex items-center justify-between border-t border-zinc-200 px-2 pt-4">
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-semibold text-zinc-950">
                      {displayName}
                    </span>
                    <span className="truncate text-[10px] text-zinc-400">
                      {displayEmail}
                    </span>
                  </div>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="h-4.5 w-4.5" />
                </Link>
              </div>
            ) : (
              <div className="border-t border-zinc-200 px-2 pt-4 flex flex-col gap-2">
                <Link
                  href="/signUp"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-all shadow-sm"
                >
                  Sign Up
                </Link>
                <Link
                  href="/signIn"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Project Creation Overlay Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-305"
            onClick={() => setIsProjectModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                Create New Project
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Establish a new developer canvas and start mapping workflows.
              </p>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="proj-name"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="proj-name"
                  type="text"
                  required
                  placeholder="e.g. Vertex Mobile App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-450 focus:border-zinc-905 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="proj-summary"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Summary
                </label>
                <textarea
                  id="proj-summary"
                  rows={3}
                  placeholder="Describe the scope, targets, or planning context..."
                  value={newProjectSummary}
                  onChange={(e) => setNewProjectSummary(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-450 focus:border-zinc-905 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="proj-goal"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Product Goal
                </label>
                <input
                  id="proj-goal"
                  type="text"
                  placeholder="e.g. Build a secure, deployment-ready workspace app"
                  value={newProjectGoal}
                  onChange={(e) => setNewProjectGoal(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-450 focus:border-zinc-905 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden transition-all"
                />
              </div>

              {userTeams.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="proj-team"
                    className="text-xs font-semibold text-zinc-700"
                  >
                    Assign to Workspace / Team{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={newProjectTeamId}
                    onValueChange={(value) =>
                      setNewProjectTeamId(value === "__none__" ? "" : value)
                    }
                    aria-label="Assign to workspace or team"
                  >
                    <SelectTrigger className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden cursor-pointer bg-white text-left">
                      <SelectValue placeholder="Select a workspace..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p>
                    You need to create or join a workspace before you can
                    create a project.{" "}
                    <Link
                      href="/teams"
                      onClick={() => setIsProjectModalOpen(false)}
                      className="font-semibold underline hover:text-amber-900"
                    >
                      Set up a workspace
                    </Link>
                  </p>
                </div>
              )}

              {createProjectError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p>{createProjectError}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !newProjectName.trim() ||
                    userTeams.length === 0
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
