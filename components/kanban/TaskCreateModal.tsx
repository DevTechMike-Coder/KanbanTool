"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { type ColumnId } from "@/lib/types/kanban";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskCreateModalProps {
  column: ColumnId;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    priority: string;
    dueDate: Date | null;
  }) => Promise<void>;
}

export default function TaskCreateModal({
  column,
  onClose,
  onSubmit,
}: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl z-10 transition-all">
        <h3 className="text-lg font-bold text-zinc-950 mb-1">Add New Task</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Adding task to column:{" "}
          <span className="font-semibold capitalize text-zinc-750">
            {column}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2"
            >
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Configure WebSocket auth handshake"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Priority
              </label>
              <Select
                value={priority}
                onValueChange={setPriority}
                aria-label="Task priority"
              >
                <SelectTrigger className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer text-left">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Due Date
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar((prev) => !prev)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                aria-label="Select due date"
              >
                {dueDate
                  ? new Date(dueDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Select due date"}
              </button>
              {showCalendar && (
                <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => {
                      setDueDate(date ? date.toISOString().split("T")[0] : "");
                      setShowCalendar(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
