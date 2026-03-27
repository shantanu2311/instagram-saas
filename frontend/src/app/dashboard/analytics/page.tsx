"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, Heart, TrendingUp, Bookmark } from "lucide-react";

const kpis = [
  { label: "Total Reach", value: "—", icon: Eye, color: "text-blue-500" },
  { label: "Engagement Rate", value: "—", icon: Heart, color: "text-ig-orange" },
  { label: "Follower Growth", value: "—", icon: TrendingUp, color: "text-emerald-500" },
  { label: "Total Saves", value: "—", icon: Bookmark, color: "text-amber-500" },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
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

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm">Engagement Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center rounded-lg border-2 border-dashed border-border/40">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Connect Instagram to see analytics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm">Performance by Content Pillar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center rounded-lg border-2 border-dashed border-border/40">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Post content to see pillar performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
