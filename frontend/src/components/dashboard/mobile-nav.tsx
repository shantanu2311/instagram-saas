"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
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
  ListChecks,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/strategy", label: "Strategy", icon: Lightbulb },
  { href: "/studio", label: "Content Studio", icon: Wand2 },
  { href: "/queue", label: "Content Queue", icon: ListChecks },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/kuraite-icon.png" alt="Kuraite" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold text-sm">Kuraite</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="px-4 py-4 border-b border-border/40">
              <SheetTitle>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2"
                  onClick={() => setOpen(false)}
                >
                  <Image src="/kuraite-icon.png" alt="Kuraite" width={32} height={32} className="rounded-lg" />
                  <span className="font-semibold">Kuraite</span>
                </Link>
              </SheetTitle>
            </SheetHeader>

            {/* Create Post button */}
            <div className="px-4 pt-4 pb-2">
              <Link href="/studio" onClick={() => setOpen(false)}>
                <button className="w-full flex items-center justify-center gap-2 rounded-lg ig-gradient px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
                  <Plus className="h-4 w-4" />
                  Create Post
                </button>
              </Link>
            </div>

            {/* Nav */}
            <nav className="px-3 py-2 space-y-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
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

            {/* Credits */}
            <div className="px-4 py-3 mt-auto border-t border-border/40">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">AI Credits</span>
                  <span className="font-medium text-muted-foreground">Free tier</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full ig-gradient"
                    style={{ width: "0%" }}
                  />
                </div>
              </div>
            </div>

            {/* Account */}
            <div className="px-4 py-3 border-t border-border/40">
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                <Globe className="h-4 w-4 text-ig-orange" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">No account</p>
                  <p className="text-[10px] text-muted-foreground">Connect Instagram</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
