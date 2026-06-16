import StatsCard from "@/components/StatsCard";
import KanbanBoard from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { getNotifications } from "@/app/actions/notifications";
import { getStats } from "@/app/actions/stats";

const t = {
  workspaceTitle: "Overview",
  workspaceDescription: "Track projects, tasks, and team activity.",
  searchPlaceholder: "Search projects, tasks, or members...",
  searchLabel: "Search workspace",
  helpLabel: "Help",
  createButton: "New Project",
};

export default async function HomePage() {
  const [initialNotifications, stats] = await Promise.all([
    getNotifications(),
    getStats(),
  ]);

  return (
    <section className="px-4 py-6 md:px-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.workspaceTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{t.workspaceDescription}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80 lg:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              aria-label={t.searchLabel}
              placeholder={t.searchPlaceholder}
              className="h-9 w-full rounded-lg border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all focus-visible:border-zinc-900 focus-visible:ring-zinc-900/10"
            />
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell initialNotifications={initialNotifications} />

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.helpLabel}
            >
              <HelpCircle />
            </Button>
          </div>
        </div>
      </header>

      <div className="mt-8">
        <StatsCard {...stats} />
      </div>

      <div className="mt-8">
        <KanbanBoard />
      </div>
    </section>
  );
}
