"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, TrendingUp, Bookmark, Globe } from "lucide-react";

const kpis = [
  { label: "Total Reach", value: "12.4K", icon: Eye, color: "text-blue-500" },
  {
    label: "Engagement Rate",
    value: "4.2%",
    icon: Heart,
    color: "text-ig-orange",
  },
  {
    label: "Follower Growth",
    value: "+340",
    icon: TrendingUp,
    color: "text-emerald-500",
  },
  {
    label: "Total Saves",
    value: "89",
    icon: Bookmark,
    color: "text-amber-500",
  },
];

const engagementData = [
  { label: "Mon", value: 35 },
  { label: "Tue", value: 52 },
  { label: "Wed", value: 41 },
  { label: "Thu", value: 68 },
  { label: "Fri", value: 55 },
  { label: "Sat", value: 78 },
  { label: "Sun", value: 72 },
];

const pillarData = [
  { label: "Facts", value: 82, color: "bg-ig-pink" },
  { label: "Education", value: 65, color: "bg-ig-orange" },
  { label: "BTS", value: 48, color: "bg-amber-500" },
  { label: "Engagement", value: 71, color: "bg-emerald-500" },
  { label: "Reels", value: 90, color: "bg-blue-500" },
];

export default function AnalyticsPage() {
  const maxEngagement = Math.max(...engagementData.map((d) => d.value));
  const maxPillar = Math.max(...pillarData.map((d) => d.value));

  return (
    <div className="p-6 space-y-6">
      {/* Connect banner */}
      <div className="flex items-center gap-3 rounded-lg border border-ig-pink/30 bg-ig-pink/5 p-4">
        <Globe className="h-5 w-5 text-ig-pink" />
        <div className="flex-1">
          <p className="text-sm font-medium">Connect Instagram for real data</p>
          <p className="text-xs text-muted-foreground">
            The data below is sample data. Connect your Instagram account in
            Settings to see real analytics.
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your Instagram performance and get AI recommendations.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 text-muted-foreground/60 border-border/40"
                    >
                      Sample
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Engagement over time - simple bar chart */}
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Engagement Over Time</CardTitle>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 text-muted-foreground/60 border-border/40"
              >
                Sample
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-2">
              {engagementData.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    {d.value}
                  </span>
                  <div
                    className="w-full rounded-t-sm bg-ig-pink/20 relative overflow-hidden"
                    style={{ height: `${(d.value / maxEngagement) * 140}px` }}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-t-sm bg-ig-pink transition-all"
                      style={{ height: `${(d.value / maxEngagement) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pillar performance - horizontal bar chart */}
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">
                Performance by Content Pillar
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 text-muted-foreground/60 border-border/40"
              >
                Sample
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pillarData.map((d) => (
                <div key={d.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs">{d.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.value}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.color} transition-all`}
                      style={{ width: `${(d.value / maxPillar) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
