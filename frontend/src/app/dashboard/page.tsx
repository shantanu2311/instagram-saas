"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  Calendar,
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Image as ImageIcon,
} from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { StrategySummaryCard } from "@/components/dashboard/strategy-summary-card";
import { PageTransition } from "@/components/page-transition";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const kpis = [
  {
    label: "Posts This Week",
    value: "3 / 7",
    icon: ImageIcon,
    color: "text-ig-pink",
    demo: true,
  },
  {
    label: "Total Reach",
    value: "2.4K",
    icon: Eye,
    color: "text-blue-500",
    demo: true,
  },
  {
    label: "Engagement Rate",
    value: "4.2%",
    icon: Heart,
    color: "text-ig-orange",
    demo: true,
  },
  {
    label: "Follower Growth",
    value: "+127",
    icon: TrendingUp,
    color: "text-emerald-500",
    demo: true,
  },
];

export default function DashboardPage() {
  return (
    <PageTransition>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, Creator!
          </h1>
          <p className="text-sm text-muted-foreground">{formatDate()}</p>
        </div>
        <Link href="/studio">
          <Button>
            <Wand2 className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    {kpi.demo && (
                      <Badge
                        variant="outline"
                        className="text-[9px] text-muted-foreground/60 border-border/40 px-1.5 py-0"
                      >
                        Sample
                      </Badge>
                    )}
                  </div>
                </div>
                <div
                  className={`h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center ${kpi.color}`}
                >
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strategy + Onboarding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StrategySummaryCard />
        <OnboardingChecklist />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/studio">
          <Card className="border-border/40 hover:border-ig-pink/30 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-ig-pink" />
                Content Studio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Generate images, reels, and captions with AI. Choose Standard or
                AI-Enhanced generation.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/calendar">
          <Card className="border-border/40 hover:border-ig-pink/30 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Content Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View and manage your posting schedule. Drag and drop to
                reschedule.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/analytics">
          <Card className="border-border/40 hover:border-ig-pink/30 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Track performance across posts, pillars, and time. Get
                AI-powered recommendations.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
    </PageTransition>
  );
}
