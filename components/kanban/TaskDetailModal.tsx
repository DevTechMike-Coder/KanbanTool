"use client";

import { useEffect, useState } from "react";
import {
  X,
  Link2,
  MessageSquare,
  Paperclip,
  Send,
  Trash2,
  File,
  Download,
  Loader2,
} from "lucide-react";
import {
  getTaskComments,
  addTaskComment,
  deleteTaskComment,
  getTaskAttachments,
  addTaskAttachment,
  deleteTaskAttachment,
  addTaskDependency,
  removeTaskDependency,
  updateTask,
  deleteTask,
} from "@/app/actions/tasks";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  type Task,
  type ColumnId,
  type Profile,
  type CurrentUser,
  type TaskComment,
  type TaskAttachment,
  COLUMNS,
  getLabelColor,
} from "@/lib/types/kanban";

interface TaskDetailModalProps {
  task: Task;
  tasks: Task[];
  profiles: Profile[];
  currentUser: CurrentUser | null;
  onClose: () => void;
  onTaskUpdated: (updated: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function TaskDetailModal({
  task,
  tasks,
  profiles,
  currentUser,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const { toast } = useToast();

  // Form state (left column)
  const [title, setTitle] = useState(task.title);
  const [assigneeId, setAssigneeId] = useState<string | null>(
    task.assignee?.id || null,
  );
  const [column, setColumn] = useState<ColumnId>(task.column);
  const [priority, setPriority] = useState(task.priority || "medium");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  );
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [labels, setLabels] = useState<string[]>(task.labels ?? []);
  const [labelInput, setLabelInput] = useState("");

  // Dependency state
  const [blockerId, setBlockerId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task>(task);

  // Comments / attachments
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  // Only show loading spinner if there's actually something to fetch
  const [isLoadingDetails, setIsLoadingDetails] = useState(
    (task.comments ?? 0) > 0 || (task.files ?? 0) > 0,
  );
  const [newCommentText, setNewCommentText] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [prevTaskId, setPrevTaskId] = useState(task.id);
  if (task.id !== prevTaskId) {
    setPrevTaskId(task.id);
    setIsLoadingDetails((task.comments ?? 0) > 0 || (task.files ?? 0) > 0);
    setComments([]);
    setAttachments([]);
  }

  // Load comments + attachments on mount — skip if counts are already 0
  useEffect(() => {
    let active = true;
    const hasComments = (task.comments ?? 0) > 0;
    const hasFiles = (task.files ?? 0) > 0;

    // Nothing to fetch — show empty state immediately, no spinner
    if (!hasComments && !hasFiles) return;

    const fetches: [Promise<TaskComment[]>, Promise<TaskAttachment[]>] = [
      hasComments
        ? (getTaskComments(task.id) as Promise<TaskComment[]>)
        : Promise.resolve([]),
      hasFiles
        ? (getTaskAttachments(task.id) as Promise<TaskAttachment[]>)
        : Promise.resolve([]),
    ];

    Promise.all(fetches)
      .then(([c, a]) => {
        if (!active) return;
        setComments(c);
        setAttachments(a);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setIsLoadingDetails(false);
      });
    return () => {
      active = false;
    };
  }, [task.id]);

  // Eligible blockers = other incomplete tasks not already linked
  const currentDepIds = new Set(
    selectedTask.dependencies?.map((d) => d.id) || [],
  );
  const eligibleBlockers = tasks.filter(
    (t) =>
      t.id !== task.id && !currentDepIds.has(t.id) && t.column !== "completed",
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateTask(task.id, {
        title: title.trim(),
        assigneeId,
        column,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels,
      });
      onTaskUpdated({
        id: updated.id,
        title: updated.title,
        column: updated.column as ColumnId,
        comments: updated.comments,
        files: updated.files,
        priority: updated.priority,
        dueDate: updated.dueDate,
        labels: updated.labels ?? labels,
        assignee: updated.assignee,
        dependencies: selectedTask.dependencies,
        blockedTasks: selectedTask.blockedTasks,
      });
      onClose();
      toast({
        title: "Task Updated",
        message: `"${updated.title}" changes saved.`,
        type: "success",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not save changes.";
      toast({ title: "Update Failed", message: msg, type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(task.id);
      onTaskDeleted(task.id);
      onClose();
      toast({
        title: "Task Deleted",
        message: `"${task.title}" has been deleted.`,
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not delete task.";
      toast({ title: "Deletion Failed", message: msg, type: "error" });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    try {
      const added = await addTaskComment(task.id, newCommentText.trim());
      setComments((prev) => [...prev, added as TaskComment]);
      setNewCommentText("");
      toast({
        title: "Comment Posted",
        message: "Your comment was added.",
        type: "success",
      });
    } catch {
      toast({
        title: "Post Failed",
        message: "Could not add comment.",
        type: "error",
      });
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteTaskComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast({
        title: "Comment Deleted",
        message: "The comment was removed.",
        type: "success",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not delete comment.";
      toast({ title: "Delete Failed", message: msg, type: "error" });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploadingFile(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? "Upload failed.");
      const added = await addTaskAttachment(
        task.id,
        payload.fileName,
        payload.url,
        payload.fileSize,
      );
      setAttachments((prev) => [...prev, added as TaskAttachment]);
      toast({
        title: "Attachment Added",
        message: `"${payload.fileName}" attached.`,
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not attach file.";
      toast({ title: "Attachment Failed", message: msg, type: "error" });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    if (!confirm("Delete this attachment?")) return;
    try {
      await deleteTaskAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast({
        title: "Attachment Deleted",
        message: "File removed.",
        type: "success",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not delete attachment.";
      toast({ title: "Delete Failed", message: msg, type: "error" });
    }
  };

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerId) return;
    setIsLinking(true);
    try {
      const updated = await addTaskDependency(task.id, blockerId);
      setSelectedTask((prev) => ({
        ...prev,
        dependencies: updated.dependencies,
      }));
      setBlockerId("");
      toast({
        title: "Blocker Added",
        message: "Task dependency linked.",
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add blocker.";
      toast({ title: "Link Failed", message: msg, type: "error" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      const updated = await removeTaskDependency(task.id, depId);
      setSelectedTask((prev) => ({
        ...prev,
        dependencies: updated.dependencies,
      }));
      toast({
        title: "Blocker Removed",
        message: "Dependency unlinked.",
        type: "success",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to remove blocker.";
      toast({ title: "Unlink Failed", message: msg, type: "error" });
    }
  };

  const handleAddLabel = () => {
    const trimmed = labelInput.trim().toLowerCase().replace(/,/g, "");
    if (trimmed && !labels.includes(trimmed))
      setLabels((prev) => [...prev, trimmed]);
    setLabelInput("");
  };

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-150 pb-3 mb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
            {task.id} • Task Inspector
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── LEFT: metadata form ─────────────────────────────────────────── */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="detail-title"
                className="block text-xs font-bold text-zinc-450 uppercase tracking-wider mb-2"
              >
                Task Title
              </label>
              <input
                id="detail-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            {/* Status + Assignee */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="detail-column"
                  className="block text-xs font-bold text-zinc-455 uppercase tracking-wider mb-2"
                >
                  Status
                </label>
                <Select
                  value={column}
                  onValueChange={(value) => setColumn(value as ColumnId)}
                  aria-label="Task status"
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="detail-assignee"
                  className="block text-xs font-bold text-zinc-455 uppercase tracking-wider mb-2"
                >
                  Assignee
                </label>
                <Select
                  value={assigneeId ?? ""}
                  onValueChange={(value) =>
                    setAssigneeId(value === "__unassigned__" ? null : value)
                  }
                  aria-label="Assignee"
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 cursor-pointer text-left">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name || p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="detail-priority"
                  className="block text-xs font-bold text-zinc-450 uppercase tracking-wider mb-2"
                >
                  Priority
                </label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  aria-label="Priority"
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
              <div>
                <label
                  htmlFor="detail-duedate"
                  className="block text-xs font-bold text-zinc-455 uppercase tracking-wider mb-2"
                >
                  Due Date
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDueDatePicker((prev) => !prev)}
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
                  {showDueDatePicker && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">
                      <Calendar
                        mode="single"
                        selected={dueDate ? new Date(dueDate) : undefined}
                        onSelect={(date) => {
                          setDueDate(
                            date ? date.toISOString().split("T")[0] : "",
                          );
                          setShowDueDatePicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-xs font-bold text-zinc-450 uppercase tracking-wider mb-2">
                Labels
              </label>
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {labels.map((label) => {
                    const c = getLabelColor(label);
                    return (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.text} ${c.border}`}
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() =>
                            setLabels((prev) => prev.filter((l) => l !== label))
                          }
                          className="ml-0.5 rounded-full hover:opacity-70 cursor-pointer"
                          aria-label={`Remove ${label}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                  placeholder="Add label, press Enter…"
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950"
                />
                <button
                  type="button"
                  onClick={handleAddLabel}
                  disabled={!labelInput.trim()}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Dependencies */}
            <div className="border-t border-zinc-100 pt-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-zinc-500" />
                Blocked By ({selectedTask.dependencies?.length || 0})
              </h4>

              {selectedTask.dependencies &&
              selectedTask.dependencies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTask.dependencies.map((dep) => {
                    const isDone = dep.column === "completed";
                    return (
                      <div
                        key={dep.id}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
                          isDone
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                            : "bg-red-50 border-red-100 text-red-750"
                        }`}
                      >
                        <span className="font-mono font-bold text-[10px]">
                          {dep.id}
                        </span>
                        <span
                          className="max-w-[120px] truncate"
                          title={dep.title}
                        >
                          {dep.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDependency(dep.id)}
                          className="text-zinc-400 hover:text-zinc-650 transition-colors p-0.5 rounded cursor-pointer"
                          title="Remove dependency"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic bg-zinc-50 border border-dashed rounded-lg p-2.5 text-center font-sans">
                  No blockers. This task can run freely!
                </p>
              )}

              {eligibleBlockers.length > 0 ? (
                <div className="flex items-center gap-2 mt-1">
                  <Select
                    value={blockerId}
                    onValueChange={(value) =>
                      setBlockerId(value === "__none__" ? "" : value)
                    }
                    aria-label="Choose task blocker"
                  >
                    <SelectTrigger className="flex-1 h-10 rounded-lg border border-zinc-200 bg-white px-3 text-left text-xs text-zinc-800 focus:border-zinc-950 focus:outline-hidden cursor-pointer">
                      <SelectValue placeholder="Choose task blocker..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        Choose task blocker...
                      </SelectItem>
                      {eligibleBlockers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.id} - {t.title.slice(0, 30)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={handleAddDependency}
                    disabled={isLinking || !blockerId}
                    className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isLinking ? "Linking..." : "Link Blocker"}
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-zinc-400 italic font-sans">
                  No other active tasks available as blockers.
                </p>
              )}
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-150 mt-6">
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-650 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
              >
                Delete Task
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>

          {/* ── RIGHT: comments + attachments ───────────────────────────────── */}
          <div className="flex flex-col gap-6 md:border-l md:border-zinc-100 md:pl-6 pt-6 md:pt-0">
            {/* Comments */}
            <div className="flex flex-col flex-1">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-450" />
                Comments ({comments.length})
              </h3>

              {isLoadingDetails ? (
                <div className="flex flex-1 items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 mb-3">
                  <p className="text-[11px] text-zinc-400 font-sans italic">
                    No discussions yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1 mb-3 scrollbar-thin">
                  {comments.map((comment) => {
                    const authorName =
                      comment.author?.name ||
                      comment.author?.email.split("@")[0] ||
                      "User";
                    const initials =
                      authorName
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "US";
                    const timeStr = new Date(
                      comment.createdAt,
                    ).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={comment.id}
                        className="flex gap-2.5 items-start p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-xs"
                      >
                        {comment.author?.avatarUrl ? (
                          <img
                            src={comment.author.avatarUrl}
                            alt={authorName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-semibold text-zinc-800">
                              {authorName}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {timeStr}
                            </span>
                          </div>
                          <p className="text-zinc-650 font-sans leading-relaxed break-words whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
                        {currentUser && currentUser.id === comment.authorId && (
                          <button
                            type="button"
                            onClick={() => handleCommentDelete(comment.id)}
                            className="text-zinc-400 hover:text-red-650 transition-colors p-0.5 shrink-0 cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <textarea
                  rows={1}
                  required
                  placeholder="Add a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-450 focus:border-zinc-950 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 resize-none max-h-20"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Post comment"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Attachments */}
            <div className="border-t border-zinc-100 pt-5">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-zinc-450" />
                Attachments ({attachments.length})
              </h3>

              {attachments.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 mb-3">
                  <p className="text-[11px] text-zinc-400 font-sans italic">
                    No files attached to this task.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 mb-3 scrollbar-thin">
                  {attachments.map((attachment) => {
                    const uploaderName =
                      attachment.user?.name ||
                      attachment.user?.email.split("@")[0] ||
                      "User";
                    return (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 hover:border-zinc-200 bg-white text-xs shadow-3xs transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <File className="w-4 h-4 text-zinc-400 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-medium text-zinc-800 truncate"
                              title={attachment.fileName}
                            >
                              {attachment.fileName}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {formatBytes(attachment.fileSize)} • by{" "}
                              {uploaderName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                            title="Download / View"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {currentUser &&
                            currentUser.id === attachment.userId && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleAttachmentDelete(attachment.id)
                                }
                                className="p-1 rounded bg-zinc-50 hover:bg-red-50 text-zinc-450 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <label
                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60 text-zinc-600 hover:text-zinc-900 text-xs font-semibold transition-all ${isUploadingFile ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                {isUploadingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading…</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach File</span>
                  </>
                )}
                <input
                  type="file"
                  className="sr-only"
                  onChange={handleFileSelect}
                  disabled={isUploadingFile}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}