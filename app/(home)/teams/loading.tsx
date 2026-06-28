import React from "react";
import VertexIcon from "@/components/logo/Vertex";

export default function TeamsParentLoading() {
  return (
    <section className="flex min-h-[calc(100vh-56px)] md:min-h-screen items-center justify-center bg-zinc-50/50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl flex flex-col items-center justify-center py-16 animate-pulse">
        <VertexIcon size={40} className="animate-spin text-zinc-300 mb-4" />
        <div className="h-6 w-48 bg-zinc-200 rounded-md mb-2"></div>
        <div className="h-4 w-32 bg-zinc-150 rounded-md"></div>
      </div>
    </section>
  );
}
