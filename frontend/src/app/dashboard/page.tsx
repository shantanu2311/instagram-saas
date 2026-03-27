"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wand2,
  Calendar,
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Image as ImageIcon,
} from "lucide-react";

const kpis = [
  { label: "Posts This Week", value: "0 / 7", icon: ImageIcon, color: "text-ig-pink" },
  { label: "Total Reach", value: "—", icon: Eye, color: "text-blue-500" },
  { label: "Engagement Rate", value: "—", icon: Heart, color: "text-ig-orange" },
  { label: "Follower Growth", value: "—", icon: TrendingUp, color: "text-emerald-500" },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your Instagram content command center.
          </p>
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
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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

      {/* Recent activity placeholder */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No posts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Head to the Content Studio to create your first post.
            </p>
            <Link href="/studio" className="mt-4">
              <Button variant="outline" size="sm">
                Create First Post
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
