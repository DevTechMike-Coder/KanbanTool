import Link from "next/link";
import { MoveLeft, Terminal } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950">
          <Terminal className="h-6 w-6" />
        </div>

        <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">
          Error 404
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Node not found
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-500">
          The workspace pathway or data vertex you are trying to access does
          not exist, has been rotated, or was moved to another pipeline.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/home"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 sm:w-auto"
          >
            <MoveLeft className="h-4 w-4" />
            Back to Overview
          </Link>

          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 sm:w-auto"
          >
            Return to Landing
          </Link>
        </div>
      </div>
    </main>
  );
}
