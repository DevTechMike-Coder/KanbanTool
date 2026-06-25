"use client";

import { useRef } from "react";
import { Layers, CheckCircle2, Users2, Activity } from "lucide-react";
import { gsap, useGSAP, EASE, prefersReducedMotion, showWithoutMotion } from "@/lib/gsap";
import CountUp from "@/components/animations/CountUp";

interface Props {
  projects: number;
  openTasks: number;
  completedTasks: number;
  teamMembers: number;
}

export default function StatsCard({
  projects,
  openTasks,
  completedTasks,
  teamMembers,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  const stats = [
    {
      name: "Active Projects",
      value: projects,
      change: "live count",
      changeType: "positive",
      icon: Layers,
      iconColor: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      name: "Open Tasks",
      value: openTasks,
      change: "Assigned",
      changeType: "neutral",
      icon: Activity,
      iconColor: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      name: "Completed Tasks",
      value: completedTasks,
      change: "Total Done",
      changeType: "positive",
      icon: CheckCircle2,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      name: "Team Members",
      value: teamMembers,
      change: "across workspaces",
      changeType: "neutral",
      icon: Users2,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.children;

      if (prefersReducedMotion()) {
        showWithoutMotion(cards);
        return;
      }

      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 18, scale: 0.97 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: EASE.smooth,
          stagger: 0.08,
          clearProps: "transform,opacity,visibility",
        },
      );
    },
    { scope: gridRef },
  );

  // Lift cards on hover for a bit more depth than the CSS transition alone gives.
  const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;
    gsap.to(e.currentTarget, { y: -4, duration: 0.25, ease: EASE.smooth });
  };
  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;
    gsap.to(e.currentTarget, { y: 0, duration: 0.25, ease: EASE.smooth });
  };

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.name}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-zinc-500">
                {stat.name}
              </span>
              <div
                className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${stat.iconColor}`}
              >
                <IconComponent aria-hidden="true" className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-zinc-900">
                <CountUp value={stat.value} />
              </span>
              <span
                className={`text-xs font-medium font-mono px-1.5 py-0.5 rounded ${
                  stat.changeType === "positive"
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-zinc-500 bg-zinc-50"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
