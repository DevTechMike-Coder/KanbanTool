import React from "react";

/**
 * Mirrors MembersView's real layout (sticky header, 3-stat grid, then a
 * lg:grid-cols-3 split: 2-col member roster + 1-col sidebar panel) so the
 * skeleton's shape matches the final content at every breakpoint.
 */
export default function TeamMembersLoading() {
  return (
    <div className="flex-1 min-h-[calc(100vh-56px)] md:min-h-screen bg-zinc-50/40 pb-12 animate-pulse">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-zinc-100" />
            <div>
              <div className="h-5 w-36 bg-zinc-200 rounded-md" />
              <div className="h-3 w-48 bg-zinc-100 rounded-md mt-2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 bg-zinc-100 rounded-lg" />
            <div className="h-9 w-32 bg-zinc-200 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Quick stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200/80 bg-white/70 p-6 flex items-center gap-4"
            >
              <div className="h-11 w-11 rounded-xl bg-zinc-100 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-2.5 w-24 bg-zinc-100 rounded-md" />
                <div className="h-5 w-12 bg-zinc-200 rounded-md" />
                <div className="h-2.5 w-28 bg-zinc-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Main split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roster */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-14 rounded-xl border border-zinc-200/60 bg-white/50" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-200/80 bg-white/80 p-5 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="h-3.5 w-28 bg-zinc-200 rounded-md" />
                      <div className="h-3 w-36 bg-zinc-100 rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                    <div className="h-3 w-24 bg-zinc-100 rounded-md" />
                    <div className="h-4 w-14 bg-zinc-100 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar panel */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-5 space-y-4">
              <div className="h-3.5 w-32 bg-zinc-200 rounded-md" />
              <div className="h-9 bg-zinc-100 rounded-lg" />
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-5 space-y-3">
              <div className="h-3.5 w-36 bg-zinc-200 rounded-md" />
              <div className="h-3 w-full bg-zinc-100 rounded-md" />
              <div className="h-3 w-5/6 bg-zinc-100 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
