"use client";

import Link from "next/link";
import {
  Wand2,
  Calendar,
  BarChart3,
  Upload,
} from "lucide-react";

const actions = [
  {
    label: "Create Post",
    href: "/studio",
    icon: Wand2,
    color: "text-ig-pink",
    bg: "bg-ig-pink/10 hover:bg-ig-pink/20",
  },
  {
    label: "View Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    label: "Media Library",
    href: "/dashboard/media",
    icon: Upload,
    color: "text-amber-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
  },
  {
    label: "Upload Content",
    href: "/studio",
    icon: Upload,
    color: "text-violet-500",
    bg: "bg-violet-500/10 hover:bg-violet-500/20",
  },
];

export function QuickActionsBar() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={`
            flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium
            transition-colors shrink-0
            ${action.bg} ${action.color}
          `}
        >
          <action.icon className="h-3.5 w-3.5" />
          {action.label}
        </Link>
      ))}
    </div>
  );
}
