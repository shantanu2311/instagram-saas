"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const tiers = [
  {
    id: "starter",
    name: "Starter",
    price: "$9/mo",
    desc: "Daily posting, full quality gate, scheduling",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29/mo",
    desc: "50 AI credits, 3 IG accounts, 90-day analytics",
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "$59/mo",
    desc: "200 AI credits, 10 IG accounts, team access",
  },
];

interface Subscription {
  tier: string;
  status: string;
  posts_this_week: number;
  posts_limit: number;
  ai_credits_remaining: number;
  ai_credits_limit: number;
  ig_accounts_limit: number;
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";

  const [sub, setSub] = useState<Subscription | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((data) => {
        if (data.tier) setSub(data);
      })
      .catch(() => {});
  }, []);

  const handleUpgrade = async (tierId: string) => {
    setUpgrading(tierId);
    setBillingError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tierId,
          user_id: "current",
          success_url: `${window.location.origin}/settings/billing?success=true`,
          cancel_url: `${window.location.origin}/settings/billing?cancelled=true`,
        }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.error) {
        setBillingError(data.error);
      }
    } catch {
      setBillingError("Could not reach billing service. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const currentTier = sub?.tier || "free";
  const postsUsed = sub?.posts_this_week || 0;
  const postsLimit = sub?.posts_limit || 3;
  const postsPercent = postsLimit > 0 ? Math.min((postsUsed / postsLimit) * 100, 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and AI credits.
        </p>
      </div>

      {/* Status banners */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Subscription activated! Your plan has been upgraded.
          </p>
        </div>
      )}
      {cancelled && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <CreditCard className="h-4 w-4 text-amber-500" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Checkout was cancelled. No changes were made.
          </p>
        </div>
      )}
      {billingError && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
          {billingError}
        </div>
      )}

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
              <p className="font-medium capitalize">
                {currentTier} Plan{" "}
                <Badge variant="outline" className="ml-2 text-[10px]">
                  Active
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {postsLimit} posts/week, {sub?.ig_accounts_limit || 1} IG account
                {(sub?.ig_accounts_limit || 1) > 1 ? "s" : ""}
                {currentTier === "free" ? ", Standard generation only" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-ig-orange" />
            Usage This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Posts</span>
              <span className="text-muted-foreground">
                {postsUsed} / {postsLimit}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-ig-pink transition-all"
                style={{ width: `${postsPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Credits */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ig-pink" />
            AI Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sub && sub.ai_credits_limit > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Credits remaining</span>
                <span className="text-muted-foreground">
                  {sub.ai_credits_remaining} / {sub.ai_credits_limit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full ig-gradient transition-all"
                  style={{
                    width: `${
                      sub.ai_credits_limit > 0
                        ? (sub.ai_credits_remaining / sub.ai_credits_limit) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upgrade to Pro to unlock AI-Enhanced content generation with 50
              credits/month.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upgrade options */}
      {currentTier === "free" && (
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-ig-pink" />
              Upgrade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-lg border p-4 space-y-2 ${
                    t.popular
                      ? "border-ig-pink bg-ig-pink/5 ring-1 ring-ig-pink/20"
                      : "border-border/40"
                  }`}
                >
                  {t.popular && (
                    <span className="text-[10px] font-medium text-ig-pink uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-lg font-bold">{t.price}</p>
                  <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                  <Button
                    size="sm"
                    className="w-full"
                    variant={t.popular ? "default" : "outline"}
                    disabled={upgrading === t.id}
                    onClick={() => handleUpgrade(t.id)}
                  >
                    {upgrading === t.id ? "Redirecting..." : "Upgrade"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
