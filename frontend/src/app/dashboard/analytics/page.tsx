"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Globe } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your Instagram performance and get AI recommendations.
        </p>
      </div>

      <Card className="border-border/40">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-ig-orange/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-ig-orange" />
            </div>
            <p className="text-sm font-medium">No analytics data yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Connect your Instagram account in Settings to see real analytics
              like reach, engagement rate, follower growth, and content performance.
            </p>
            <Link href="/settings" className="mt-4">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Connect Instagram
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
