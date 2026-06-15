"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, UserCheck, MessageCircle, Users, Check, CheckCheck, X } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/actions/notifications";

type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function NotifIcon({ type }: { type: string }) {
  const base = "h-4 w-4";
  if (type === "task_assigned")
    return <UserCheck className={`${base} text-blue-600`} />;
  if (type === "task_comment")
    return <MessageCircle className={`${base} text-violet-600`} />;
  if (type === "team_invite")
    return <Users className={`${base} text-emerald-600`} />;
  return <Bell className={`${base} text-zinc-500`} />;
}

function notifBg(type: string) {
  if (type === "task_assigned") return "bg-blue-50";
  if (type === "task_comment") return "bg-violet-50";
  if (type === "team_invite") return "bg-emerald-50";
  return "bg-zinc-50";
}

export default function NotificationBell({
  initialNotifications = [],
}: {
  initialNotifications: Notification[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Re-fetch when opening the panel
  const handleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open) {
      const fresh = await getNotifications();
      setNotifications(fresh as Notification[]);
    }
  };

  const handleMarkOne = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  };

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) handleMarkOne(notif.id);
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    }
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell trigger */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="fixed inset-x-3 top-20 z-50 rounded-xl border border-zinc-200 bg-white shadow-xl animate-in fade-in zoom-in-95 sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-80">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-950">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={isPending}
                  title="Mark all as read"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="h-3 w-3" />
                  All read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
            {notifications.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                  <Bell className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-600">
                  All caught up
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  No notifications yet.
                </p>
              </li>
            ) : (
              notifications.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 cursor-pointer ${
                      !notif.read ? "bg-zinc-50/80" : "bg-white"
                    }`}
                  >
                    {/* Type icon */}
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${notifBg(notif.type)}`}
                    >
                      <NotifIcon type={notif.type} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs leading-5 text-zinc-800 ${!notif.read ? "font-semibold" : "font-normal"}`}
                      >
                        {notif.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-400">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot or check */}
                    <div className="mt-1 shrink-0">
                      {notif.read ? (
                        <Check className="h-3 w-3 text-zinc-300" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
