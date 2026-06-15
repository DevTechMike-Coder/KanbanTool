"use client";

import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  X,
  Keyboard,
  BookOpen,
  Zap,
  ChevronRight,
  LayoutDashboard,
  KanbanSquare,
  Users,
  Bell,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ────────────────────────────────────────────────────────────────────

type Section = "overview" | "shortcuts" | "faq";

// ── Data ─────────────────────────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ["N"], label: "New project" },
  { keys: ["T"], label: "New task" },
  { keys: ["/"], label: "Focus search" },
  { keys: ["Esc"], label: "Close modal / panel" },
  { keys: ["Ctrl", "K"], label: "Command palette (coming soon)" },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Overview",
    desc: "Dashboard stats: active projects, open & completed tasks, team members.",
    href: "/home",
  },
  {
    icon: KanbanSquare,
    title: "Kanban Board",
    desc: "Drag tasks across custom workflow stages. Filter by assignee, priority, or due date.",
    href: null,
  },
  {
    icon: Users,
    title: "Teams & Workspaces",
    desc: "Create teams, invite members via link, and collaborate across projects.",
    href: "/home/teams",
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Real-time alerts for task assignments, comments, and team invites.",
    href: null,
  },
  {
    icon: Settings,
    title: "Settings",
    desc: "Update your profile, name, avatar, and account preferences.",
    href: "/home/settings",
  },
];

const FAQ = [
  {
    q: "How do I create a new project?",
    a: 'Click the "+ New Project" button in the sidebar or the Kanban Board header. Assign it to a team workspace to keep tasks scoped.',
  },
  {
    q: "How do I invite someone to my team?",
    a: "Go to Teams, open your workspace, and copy the invite link. Anyone with the link can join your team.",
  },
  {
    q: "Can I assign tasks to team members?",
    a: "Yes — open any task card to access the detail modal, where you can set the assignee, due date, and priority.",
  },
  {
    q: "How do workflow stages work?",
    a: "Each project has its own custom stages (e.g. Backlog → In Progress → Review → Done). You can configure them per project.",
  },
  {
    q: "Where do I change my avatar?",
    a: "Settings → Profile. You can pick a preset or upload your own image.",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-zinc-200 bg-zinc-100 px-1.5 font-mono text-[11px] font-semibold text-zinc-700 shadow-sm">
      {children}
    </kbd>
  );
}

function NavBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full text-left ${
        active
          ? "bg-zinc-950 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Lock body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Help"
        onClick={() => { setOpen(true); setSection("overview"); }}
        className="cursor-pointer"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Help & Documentation"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950">
              <HelpCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Help Center</p>
              <p className="text-[11px] text-zinc-400">Vertex documentation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close help panel"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex gap-1 border-b border-zinc-100 px-4 py-2.5">
          <NavBtn active={section === "overview"} onClick={() => setSection("overview")}>
            <BookOpen className="h-3.5 w-3.5" /> Overview
          </NavBtn>
          <NavBtn active={section === "shortcuts"} onClick={() => setSection("shortcuts")}>
            <Keyboard className="h-3.5 w-3.5" /> Shortcuts
          </NavBtn>
          <NavBtn active={section === "faq"} onClick={() => setSection("faq")}>
            <Zap className="h-3.5 w-3.5" /> FAQ
          </NavBtn>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── Overview ── */}
          {section === "overview" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest mb-1">
                Features
              </p>
              {FEATURES.map(({ icon: Icon, title, desc, href }) => (
                <div
                  key={title}
                  className="group flex items-start gap-3.5 rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 transition-colors hover:border-zinc-200 hover:bg-white"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200">
                    <Icon className="h-4 w-4 text-zinc-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">{title}</p>
                      {href && (
                        <a
                          href={href}
                          className="shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-700"
                          aria-label={`Go to ${title}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Shortcuts ── */}
          {section === "shortcuts" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest mb-1">
                Keyboard Shortcuts
              </p>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden">
                {SHORTCUTS.map(({ keys, label }, i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < SHORTCUTS.length - 1 ? "border-b border-zinc-100" : ""
                    }`}
                  >
                    <span className="text-sm text-zinc-700">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, ki) => (
                        <span key={k} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {ki < keys.length - 1 && (
                            <span className="text-xs text-zinc-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-400 mt-2 text-center">
                More shortcuts coming with the command palette.
              </p>
            </div>
          )}

          {/* ── FAQ ── */}
          {section === "faq" && (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest mb-1">
                Frequently Asked
              </p>
              {FAQ.map(({ q, a }) => (
                <FAQItem key={q} question={q} answer={a} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 px-5 py-4">
          <p className="text-center text-[11px] text-zinc-400">
            Vertex · Built with Next.js + Supabase
          </p>
        </div>
      </div>
    </>
  );
}

// ── Accordion FAQ item ────────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-zinc-900">{question}</span>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          expanded ? "max-h-40" : "max-h-0"
        }`}
      >
        <p className="border-t border-zinc-100 px-4 py-3 text-xs leading-relaxed text-zinc-500">
          {answer}
        </p>
      </div>
    </div>
  );
}
