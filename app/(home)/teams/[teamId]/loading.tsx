import React from "react";
import { Users } from "lucide-react";

/**
 * Mirrors TeamChat's real layout 1:1 (same breakpoints: left roster hidden
 * below md, right tasks panel hidden below lg) so swapping the skeleton for
 * real content never changes shape — only content fades/pops in.
 */
export default function TeamWorkspaceLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-2px)] w-full bg-white animate-pulse">
      {/* Header */}
      <header className="flex flex-col gap-3 px-4 py-4 border-b border-zinc-100 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-200 shrink-0" />
            <div className="h-5 w-40 bg-zinc-200 rounded-md" />
            <div className="h-6 w-28 bg-zinc-100 rounded-lg" />
          </div>
          <div className="h-3 w-56 bg-zinc-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-zinc-100 rounded-lg" />
          <div className="h-9 w-32 bg-zinc-200 rounded-lg" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile online indicator bar */}
        <div className="md:hidden border-b border-zinc-100 px-4 py-2 w-full absolute z-10 bg-white">
          <div className="h-3.5 w-24 bg-zinc-100 rounded-md" />
        </div>

        {/* Left aside: roster (desktop/tablet only, matches TeamChat) */}
        <aside className="w-80 border-r border-zinc-100 bg-zinc-50/30 flex-col p-4 overflow-hidden hidden md:flex">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="h-3 w-36 bg-zinc-200 rounded-md" />
            <div className="h-3 w-12 bg-zinc-100 rounded-md" />
          </div>
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-zinc-100"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-200 shrink-0" />
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="h-2.5 w-20 bg-zinc-200 rounded-md" />
                  <div className="h-2 w-28 bg-zinc-100 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: chat */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden pt-10 md:pt-0">
          <div className="flex-1 px-4 py-4 sm:px-6 flex flex-col gap-6">
            {/* Incoming bubble */}
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-zinc-200 rounded-full shrink-0" />
              <div className="space-y-2 max-w-[75%]">
                <div className="h-2.5 w-24 bg-zinc-200 rounded-md" />
                <div className="h-10 w-64 bg-zinc-100 rounded-r-xl rounded-bl-xl" />
              </div>
            </div>
            {/* Own bubble */}
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="h-8 w-8 bg-indigo-100 rounded-full shrink-0" />
              <div className="space-y-2 max-w-[75%] flex flex-col items-end">
                <div className="h-2.5 w-20 bg-zinc-200 rounded-md" />
                <div className="h-14 w-72 bg-indigo-50/60 rounded-l-xl rounded-br-xl" />
              </div>
            </div>
            {/* Incoming bubble */}
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-zinc-200 rounded-full shrink-0" />
              <div className="space-y-2 max-w-[75%]">
                <div className="h-2.5 w-16 bg-zinc-200 rounded-md" />
                <div className="h-8 w-48 bg-zinc-100 rounded-r-xl rounded-bl-xl" />
              </div>
            </div>
          </div>
          {/* Composer */}
          <div className="p-4 sm:px-6 border-t border-zinc-100">
            <div className="flex gap-2">
              <div className="flex-1 h-11 bg-zinc-100 rounded-xl" />
              <div className="h-11 w-11 bg-zinc-200 rounded-xl shrink-0" />
            </div>
          </div>
        </main>

        {/* Right aside: tasks (desktop only, matches TeamChat) */}
        <aside className="w-80 border-l border-zinc-100 bg-zinc-50/30 flex-col p-4 overflow-hidden hidden lg:flex gap-6">
          <div>
            <div className="h-3 w-28 bg-zinc-200 rounded-md mb-3" />
            <div className="space-y-2.5">
              <div className="h-16 bg-white border border-zinc-100 rounded-xl" />
              <div className="h-16 bg-white border border-zinc-100 rounded-xl" />
            </div>
          </div>
          <div>
            <div className="h-3 w-24 bg-zinc-200 rounded-md mb-3" />
            <div className="space-y-2.5">
              <div className="h-16 bg-rose-50/40 border border-rose-100/40 rounded-xl" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
