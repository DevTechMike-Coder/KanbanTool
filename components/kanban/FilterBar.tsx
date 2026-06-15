"use client";

import { Search, X } from "lucide-react";
import { type Profile, type Task, getLabelColor } from "@/lib/types/kanban";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterPriority: string;
  onPriorityChange: (v: string) => void;
  filterAssigneeId: string;
  onAssigneeChange: (v: string) => void;
  filterLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  profiles: Profile[];
  tasks: Task[];
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  filterPriority,
  onPriorityChange,
  filterAssigneeId,
  onAssigneeChange,
  filterLabels,
  onLabelsChange,
  profiles,
  tasks,
}: FilterBarProps) {
  const allLabels = Array.from(
    new Set(tasks.flatMap((t) => t.labels ?? [])),
  ).sort();
  const hasActiveFilter =
    !!filterPriority ||
    !!filterAssigneeId ||
    filterLabels.length > 0 ||
    !!searchQuery;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Text search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Filter tasks (e.g. VTX, critical, Alex)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-52 sm:w-64 rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Priority */}
      <Select
        value={filterPriority}
        onValueChange={(value) =>
          onPriorityChange(value === "__all__" ? "" : value)
        }
        aria-label="Filter priority"
      >
        <SelectTrigger className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 focus:border-zinc-950 focus:outline-hidden shadow-sm cursor-pointer text-left">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      {/* Assignee */}
      <Select
        value={filterAssigneeId}
        onValueChange={(value) =>
          onAssigneeChange(value === "__all__" ? "" : value)
        }
        aria-label="Filter assignee"
      >
        <SelectTrigger className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 focus:border-zinc-950 focus:outline-hidden shadow-sm cursor-pointer text-left">
          <SelectValue placeholder="All assignees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All assignees</SelectItem>
          <SelectItem value="__unassigned__">Unassigned</SelectItem>
          {profiles.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name || p.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Label chips */}
      {allLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {allLabels.map((label) => {
            const active = filterLabels.includes(label);
            const c = getLabelColor(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() =>
                  onLabelsChange(
                    active
                      ? filterLabels.filter((l) => l !== label)
                      : [...filterLabels, label],
                  )
                }
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                  active
                    ? `${c.bg} ${c.text} ${c.border} shadow-sm`
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Clear all */}
      {hasActiveFilter && (
        <button
          type="button"
          onClick={() => {
            onPriorityChange("");
            onAssigneeChange("");
            onLabelsChange([]);
            onSearchChange("");
          }}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-sm cursor-pointer"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
