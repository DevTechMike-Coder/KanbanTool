import VertexIcon from "@/components/ui/logo/Vertex";
import { MoveUpRight, ShieldCheck, Users, Zap, GitBranch, Share2, Cpu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const t = {
  brandName: "Vertex Canvas",
  signIn: "SIGN IN",
  heroTitle: "The collaborative canvas where your developer workflows intersect.",
  heroDescription: "Vertex Canvas is a high-performance, developer-centric project management platform designed for teams that require absolute precision, real-time synchronization, and ironclad security. Moving away from cluttered, slow-moving legacy tools, Vertex treats your workflow as a dynamic network of interconnected data points.",
  getStarted: "Get Started",
  whyChooseTitle: "Why Choose Vertex Canvas?",
  choose: "Choose",
  vertex: "Vertex",
  whyChooseText: "because a vertex is the exact point where multiple lines intersect in a network. In product development, your team, your code, your security pipelines, and your tasks all intersect at one focal point.",
  whyChooseTextEnd: "represents that ultimate hub where everything connects seamlessly.",
  featuresTitle: "Experience the Future of Project Management",
  securityTitle: "Ironclad Security",
  securityDesc: "Data protected with enterprise-grade encryption and compliance measures.",
  collabTitle: "Real-Time Collaboration",
  collabDesc: "Instant updates and seamless communication for teams that need to stay in sync, no matter where they are.",
  perfTitle: "Blazing Fast Performance",
  perfDesc: "Engineered with optimization cores and persistent WebSockets for sub-50ms state updates and zero UI lag.",
  kanbanPageAlt: "Kanban Page"
};

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-1 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-200/50 dark:border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-xl font-semibold tracking-wide text-gray-900 hover:text-gray-700"
          >
            <div className="flex items-center gap-2">
              <VertexIcon />
              {t.brandName}
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/signIn"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {t.signIn}{" "}<MoveUpRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* About */}
      <section className="flex flex-col items-center justify-center text-center gap-6 max-w-3xl mx-auto px-4 py-20">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-2">
            {t.heroTitle}
          </h1>

          <p className="text-lg text-gray-600">
            {t.heroDescription}
          </p>
        </div>
        <div>
          <Link
            href="/home"
            className="flex items-center gap-1 text-xl border border-gray-300 rounded-md px-4 py-2"
          >
            {t.getStarted}
          </Link>
        </div>
      </section>

      {/* Why Choose Vertex Canvas? */}
      <section className="border-t border-gray-200 dark:border-zinc-800/80 py-16 px-4 max-w-7xl mx-auto" id="canvas">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            {t.whyChooseTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text points */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-zinc-300 leading-relaxed">
                {"A vertex is the exact point where multiple lines intersect in a network. In product development, your team, your code, your pipelines, and your tasks all intersect at one focal point."}
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{"Code & Tasks Intersect"}</h4>
                  <p className="text-sm text-gray-650 dark:text-zinc-400 mt-1">{"Map issues, sprints, and code commits into a unified visual graph."}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{"Teams Intersect"}</h4>
                  <p className="text-sm text-gray-650 dark:text-zinc-400 mt-1">{"Work concurrently with real-time multi-player updates and zero latency."}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{"Performance & Data Intersect"}</h4>
                  <p className="text-sm text-gray-650 dark:text-zinc-400 mt-1">{"Watch state updates synchronize seamlessly with zero interface lag."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Styled Image Frame */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-gray-200/80 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-2 shadow-2xl overflow-hidden group transition-all duration-300 hover:border-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200/80 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-t-xl mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <Image
                src="/image/kanbanPage.jpg"
                alt={t.kanbanPageAlt}
                width={800}
                height={800}
                className="rounded-lg w-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-gray-200 dark:border-zinc-800/80 py-16 px-4 max-w-7xl mx-auto" id="features">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            {t.featuresTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {/* Feature 1: Ironclad Security */}
          <div className="group relative flex flex-col justify-between p-8 rounded-2xl bg-white dark:bg-zinc-900/50 border border-gray-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  {t.securityTitle}
                </h3>
                <p className="text-sm text-gray-650 dark:text-zinc-400 leading-relaxed">
                  {t.securityDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2: Real-Time Collaboration */}
          <div className="group relative flex flex-col justify-between p-8 rounded-2xl bg-white dark:bg-zinc-900/50 border border-gray-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md hover:border-emerald-500/20 dark:hover:border-emerald-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  {t.collabTitle}
                </h3>
                <p className="text-sm text-gray-650 dark:text-zinc-400 leading-relaxed">
                  {t.collabDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3: Blazing Fast Performance */}
          <div className="group relative flex flex-col justify-between p-8 rounded-2xl bg-white dark:bg-zinc-900/50 border border-gray-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md hover:border-amber-500/20 dark:hover:border-amber-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  {t.perfTitle}
                </h3>
                <p className="text-sm text-gray-650 dark:text-zinc-400 leading-relaxed">
                  {t.perfDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <footer className="w-full border-t border-gray-200 dark:border-zinc-800 backdrop-blur-sm mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-100 dark:border-zinc-800/50">
          
          {/* Brand Column */}
          <div className="flex flex-col gap-3 md:col-span-1">
            <div className="flex items-center gap-2">
        <VertexIcon />
              <span className="text-lg font-bold tracking-wide text-gray-900 dark:text-zinc-100">
                {"Vertex Canvas"}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              {"The high-performance workspace network mapping your engineering workflows from architecture to deployment."}
            </p>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{"Product"}</span>
            <Link href="#features" className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all duration-200 hover:translate-x-0.5">{"Features"}</Link>
            <Link href="#canvas" className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all duration-200 hover:translate-x-0.5">{"The Canvas"}</Link>
            <Link href="/security" className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all duration-200 hover:translate-x-0.5">{"Security Vault"}</Link>
          </div>

          {/* Developers Links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{"Developers"}</span>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all duration-200 hover:translate-x-0.5">{"Documentation"}</Link>
            <Link href="/changelog" className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all duration-200 hover:translate-x-0.5">{"Changelog"}</Link>
            <Link href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all duration-200 hover:translate-x-0.5">{"GitHub"}</Link>
          </div>

          {/* Corporate / Compliance Links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{"Legal"}</span>
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all duration-200 hover:translate-x-0.5">{"Privacy Policy"}</Link>
            <Link href="/terms" className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all duration-200 hover:translate-x-0.5">{"Terms of Service"}</Link>
          </div>

        </div>

        {/* Bottom Copyright Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-gray-500 dark:text-zinc-400">
          <div>
            {"© 2026 Vertex Canvas Inc. All rights reserved."}
          </div>
          <div className="flex gap-4">
            <a href="#" className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors" aria-label="Twitter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors" aria-label="Discord">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.197.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
    </main>
  );
}

