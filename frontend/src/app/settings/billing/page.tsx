"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Sparkles, Zap } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and AI credits.
        </p>
      </div>

      {/* Current plan */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Free Plan{" "}
                <Badge variant="outline" className="ml-2 text-[10px]">
                  Active
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                3 posts/week, 1 IG account, Standard generation only
              </p>
            </div>
            <Button size="sm">Upgrade</Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Usage This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Posts</span>
              <span className="text-muted-foreground">0 / 3</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-0 rounded-full bg-purple-500 transition-all" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Credits */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro to unlock AI-Enhanced content generation with 50
            credits/month.
          </p>
          <Button size="sm" variant="outline" className="mt-3">
            View Plans
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
