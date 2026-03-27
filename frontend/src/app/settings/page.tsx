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
import { Globe, Palette, User, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { PageTransition } from "@/components/page-transition";

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const igConnected = searchParams.get("ig_connected") === "true";
  const igError = searchParams.get("ig_error");
  const [saved, setSaved] = useState(false);

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
      {igConnected && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Instagram account connected successfully!
          </p>
        </div>
      )}
      {igError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {igError === "denied"
              ? "Instagram connection was denied. Please try again."
              : igError === "token_failed"
              ? "Failed to get Instagram access token. Please try again."
              : "An error occurred connecting Instagram. Please try again."}
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
              <Label className="text-xs">Name</Label>
              <Input placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input placeholder="your@email.com" disabled />
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
        <CardContent>
          <div className="flex items-center justify-between">
            {igConnected ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">Instagram connected</p>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                    Connected
                  </Badge>
                </div>
                <Button size="sm" variant="outline">
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  No Instagram account connected.
                </p>
                <Link href="/api/instagram/connect">
                  <Button size="sm" variant="outline">
                    Connect Instagram
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

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
