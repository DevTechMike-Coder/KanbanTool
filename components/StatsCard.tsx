import { Layers, CheckCircle2, Users2, Activity } from "lucide-react";

export default function StatsCard({
  activeProjects = 0,
  openTasks = 0,
  completedTasks = 0,
  teamMembers = 0,
}: {
  activeProjects?: number;
  openTasks?: number;
  completedTasks?: number;
  teamMembers?: number;
}) {
  const stats = [
    {
      name: "Active Projects",
      value: activeProjects.toString(),
      change: "Live",
      changeType: "positive",
      icon: Layers,
      iconColor: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      name: "Open Tasks",
      value: openTasks.toString(),
      change: "Assigned",
      changeType: "neutral",
      icon: Activity,
      iconColor: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      name: "Completed Tasks",
      value: completedTasks.toString(),
      change: "Total Done",
      changeType: "positive",
      icon: CheckCircle2,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      name: "Team Members",
      value: teamMembers.toString(),
      change: "Registered",
      changeType: "neutral",
      icon: Users2,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;

        return (
          <div
            key={stat.name}
            className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
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
                {stat.value}
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
