"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
  CreditCard,
  Globe,
  Lightbulb,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/strategy", label: "Strategy", icon: Lightbulb },
  { href: "/studio", label: "Content Studio", icon: Wand2 },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border/40 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg ig-gradient flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold">IGCreator</span>
        </Link>
      </div>

      {/* Create Post button */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/studio">
          <button className="w-full flex items-center justify-center gap-2 rounded-lg ig-gradient px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
            <Plus className="h-4 w-4" />
            Create Post
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-ig-pink/10 text-ig-pink font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* AI Credits */}
      <div className="px-3 py-3 border-t border-border/40">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI Credits</span>
            <span className="font-medium text-muted-foreground">Free tier</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full ig-gradient transition-all"
              style={{ width: "0%" }}
            />
          </div>
        </div>
      </div>

      {/* Account selector */}
      <div className="px-3 py-3 border-t border-border/40">
        <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
          <Globe className="h-4 w-4 text-ig-orange" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">No account</p>
            <p className="text-[10px] text-muted-foreground">Connect Instagram</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </aside>
  );
}
