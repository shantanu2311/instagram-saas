"use client";

import { useState } from "react";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Plus, AtSign } from "lucide-react";

export function DiscoveryStepCompetitors() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();
  const [handle, setHandle] = useState("");

  const addCompetitor = () => {
    const trimmed = handle.trim().replace(/^@/, "");
    if (
      trimmed &&
      !profile.competitors.includes(trimmed) &&
      profile.competitors.length < 5
    ) {
      updateProfile({ competitors: [...profile.competitors, trimmed] });
      setHandle("");
    }
  };

  const removeCompetitor = (c: string) => {
    updateProfile({
      competitors: profile.competitors.filter((x) => x !== c),
    });
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Search className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Who inspires you?</h2>
        <p className="text-muted-foreground">
          Add competitors or accounts you admire. We&apos;ll analyze their strategy to find opportunities for you.
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          Optional — you can skip this and add them later.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                placeholder="e.g., nike, garyvee"
                className="pl-8"
              />
            </div>
            <Button
              onClick={addCompetitor}
              disabled={
                !handle.trim() || profile.competitors.length >= 5
              }
              size="default"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Add 1-5 competitor Instagram handles. You can add competitors later.
          </p>

          {profile.competitors.length > 0 && (
            <div className="space-y-2">
              {profile.competitors.map((c) => (
                <div
                  key={c}
                  className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">@{c}</span>
                  </div>
                  <button
                    onClick={() => removeCompetitor(c)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={prevDiscoveryStep} size="lg">
          Back
        </Button>
        <Button
          onClick={nextDiscoveryStep}
          size="lg"
          className="px-12"
        >
          {profile.competitors.length > 0 ? "Continue" : "Skip for now"}
        </Button>
      </div>
    </div>
  );
}
