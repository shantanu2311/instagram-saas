"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, Palette, User, Shield, CheckCircle2, AlertCircle, Send, Loader2 } from "lucide-react";
import { useEffect, useCallback } from "react";
import { PageTransition } from "@/components/page-transition";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}

interface IgStatus {
  connected: boolean;
  username?: string;
  name?: string;
  profilePicUrl?: string;
  followersCount?: number;
  igAccountId?: string;
  connectedAt?: string;
  expiresAt?: string;
  source?: string;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("ig_connected") === "true";
  const justDisconnected = searchParams.get("ig_disconnected") === "true";
  const igError = searchParams.get("ig_error");
  const [igStatus, setIgStatus] = useState<IgStatus | null>(null);
  const [igLoading, setIgLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userName, setUserName] = useState("User");

  // Fetch real Instagram connection status
  const fetchIgStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/instagram/status");
      const data = await res.json();
      setIgStatus(data);
    } catch {
      setIgStatus({ connected: false });
    } finally {
      setIgLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIgStatus();
  }, [fetchIgStatus]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/instagram/disconnect", { method: "POST" });
      setIgStatus({ connected: false });
      window.history.replaceState({}, "", "/settings");
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveChanges = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageTransition>
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and brand settings.
        </p>
      </div>

      {/* Instagram connection status banners */}
      {justConnected && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Instagram Business account connected successfully!
          </p>
        </div>
      )}
      {justDisconnected && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Instagram account disconnected.
          </p>
        </div>
      )}
      {igError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {igError === "denied"
              ? "Instagram connection was denied. Please try again."
              : igError === "token_exchange_failed"
              ? "Failed to exchange Facebook token. Check your App ID and Secret."
              : igError === "no_facebook_page"
              ? "No Facebook Page found. Your Instagram Business account must be linked to a Facebook Page."
              : igError === "no_business_account"
              ? "No Instagram Business/Creator account found. Convert your account to Business or Creator first, then link it to a Facebook Page."
              : igError === "invalid_state"
              ? "Security check failed. Please try connecting again."
              : `Connection error: ${igError}`}
          </p>
        </div>
      )}

      {/* Account */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name" className="text-xs">Name</Label>
              <Input
                id="settings-name"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-xs">Email</Label>
              <Input id="settings-email" placeholder="your@email.com" disabled />
            </div>
          </div>
          <Button size="sm" onClick={handleSaveChanges}>
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Instagram connection */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-ig-orange" />
            Instagram Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {igLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Checking connection...</p>
            </div>
          ) : igStatus?.connected ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {igStatus.profilePicUrl && (
                    <img
                      src={igStatus.profilePicUrl}
                      alt={igStatus.username}
                      className="h-10 w-10 rounded-full border border-border/40"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">@{igStatus.username}</p>
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                        Connected
                      </Badge>
                    </div>
                    {igStatus.name && (
                      <p className="text-[11px] text-muted-foreground">{igStatus.name}</p>
                    )}
                    {igStatus.followersCount ? (
                      <p className="text-[11px] text-muted-foreground">
                        {igStatus.followersCount.toLocaleString()} followers
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Disconnect"
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {igStatus.source === "env"
                  ? "Using environment variable credentials (dev mode)"
                  : "Connected via Facebook OAuth — enables competitor analysis via Graph API"}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    No Instagram account connected.
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Connect a Business or Creator account to enable competitor analysis via Instagram Graph API.
                  </p>
                </div>
                <Link href="/api/instagram/connect">
                  <Button size="sm" variant="outline">
                    Connect Instagram
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Posting Preferences */}
      <PostingPreferenceCard />

      {/* Brand settings */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-ig-pink" />
            Brand Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete onboarding to set up your brand identity.
          </p>
          <Link href="/onboarding">
            <Button size="sm" variant="outline" className="mt-3">
              Edit Brand
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button size="sm" variant="outline" disabled className="opacity-50">
            Change Password
            <span className="ml-2 text-[10px] text-muted-foreground">(Coming soon)</span>
          </Button>
          <div>
            <Button size="sm" variant="destructive" disabled className="opacity-50">
              Delete Account
              <span className="ml-2 text-[10px]">(Contact support)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}

function PostingPreferenceCard() {
  const { brand, updateBrand } = useOnboardingStore();
  const level = brand.automationLevel || "approve-posts";

  const options = [
    {
      value: "full-control" as const,
      label: "Full Control",
      description: "Preview design, approve scripts, then approve each post",
    },
    {
      value: "approve-posts" as const,
      label: "Approve Posts",
      description: "Auto-generate content, review each post before it goes live",
    },
    {
      value: "full-auto" as const,
      label: "Full Auto",
      description: "Generate and post everything automatically per schedule",
    },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Send className="h-4 w-4 text-ig-orange" />
          Automation Level
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Choose how much control you want over content generation and posting.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateBrand({ automationLevel: opt.value })}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                level === opt.value
                  ? "border-ig-pink bg-ig-pink/10"
                  : "border-border/40 hover:border-ig-pink/30"
              }`}
            >
              <p className="text-xs font-medium">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {opt.description}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
