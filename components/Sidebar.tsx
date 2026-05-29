import Link from "next/link";
import { FolderGit2, Home, Users, type LucideIcon } from "lucide-react";
import VertexIcon from "./iconComp/Vertex";
import SidebarIcon from "./iconComp/SidebarIcon";

const primaryNavItems: Array<{
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
}> = [
  { icon: Home, label: "Overview", href: "/home", active: true },
  { icon: Users, label: "Team Collaboration", href: "/team-collab" },
];

const projectItems = [
  { label: "Vertex Core App", href: "/home/projects/vertex-core" },
  { label: "Landing Design", href: "/home/projects/landing-design" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col justify-between border-r border-zinc-200 bg-white p-4 md:flex">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <VertexIcon />
            <span className="truncate text-lg font-bold tracking-tight text-zinc-950">
              Vertex Canvas
            </span>
          </Link>

          <button
            type="button"
            aria-label="Collapse sidebar"
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-indigo-600"
          >
            <SidebarIcon size={22} />
          </button>
        </div>

        <nav aria-label="Main Navigation" className="flex flex-col gap-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.active
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
            <span className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Projects
            </span>

            {projectItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
              >
                <FolderGit2 className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="flex items-center gap-3 border-t border-zinc-200 px-2 pt-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
          ME
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-semibold text-zinc-950">
            Michael
          </span>
          <span className="truncate text-[10px] text-zinc-400">
            dev@vertexcanvas.com
          </span>
        </div>
      </div>
    </aside>
  );
}
